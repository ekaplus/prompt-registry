pipeline {
    agent any
    
    environment {
        // Docker image configuration
        DOCKER_REGISTRY = '192.168.1.225:50000'  // Open Docker registry (no auth required)
        IMAGE_NAME = 'prompts-chat'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
        DOCKER_IMAGE_LATEST = "${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
        
        // Database credentials for different environments
        DB_CREDENTIALS_DEV = 'database-credentials-dev'
        DB_CREDENTIALS_QA = 'database-credentials-qa'
        DB_CREDENTIALS_PROD = 'database-credentials-prod'
        
        // Deployment configuration
        DEPLOY_ENV = "${params.DEPLOY_ENVIRONMENT}"
    }
    
    parameters {
        choice(
            name: 'DEPLOY_ENVIRONMENT',
            choices: ['none', 'dev', 'qa', 'preprod', 'prod'],
            description: 'Select environment to deploy'
        )
        booleanParam(
            name: 'PUSH_TO_REGISTRY',
            defaultValue: true,
            description: 'Push image to Docker registry'
        )
        booleanParam(
            name: 'RUN_MIGRATIONS',
            defaultValue: true,
            description: 'Run database migrations after deployment'
        )
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out code from repository..."
                    checkout scm
                    
                    // Get git commit info
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH = sh(
                        script: "git rev-parse --abbrev-ref HEAD",
                        returnStdout: true
                    ).trim()
                    
                    echo "Git Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Git Branch: ${env.GIT_BRANCH}"
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                script {
                    echo "Setting up build environment..."
                    
                    // Create .env file for build (if needed)
                    sh '''
                        echo "NODE_ENV=production" > .env.build
                        echo "BUILD_NUMBER=${BUILD_NUMBER}" >> .env.build
                        echo "GIT_COMMIT=${GIT_COMMIT_SHORT}" >> .env.build
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image using docker build..."
                    
                    // Build directly with docker build (avoids docker-compose env var issues)
                    sh """
                        docker build \
                            -f docker-custom/Dockerfile \
                            -t prompts-chat:latest \
                            -t ${DOCKER_IMAGE} \
                            -t ${DOCKER_IMAGE_LATEST} \
                            --build-arg NODE_ENV=production \
                            --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                            --build-arg GIT_COMMIT=${GIT_COMMIT_SHORT} \
                            .
                    """
                    
                    echo "Docker image built successfully: ${DOCKER_IMAGE}"
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                expression { params.PUSH_TO_REGISTRY == true }
            }
            steps {
                script {
                    echo "Pushing Docker image to open registry..."
                    
                    // Push to open registry (no authentication required)
                    sh """
                        docker push ${DOCKER_IMAGE}
                        docker push ${DOCKER_IMAGE_LATEST}
                    """
                    
                    echo "Image pushed: ${DOCKER_IMAGE}"
                }
            }
        }
        
        stage('Deploy to Environment') {
            when {
                expression { params.DEPLOY_ENVIRONMENT != 'none' }
            }
            steps {
                script {
                    echo "Deploying to ${DEPLOY_ENV} environment..."
                    
                    // Select credentials based on environment
                    def dbCredentialsId = ''
                    switch(DEPLOY_ENV) {
                        case 'dev':
                            dbCredentialsId = DB_CREDENTIALS_DEV
                            break
                        case 'qa':
                            dbCredentialsId = DB_CREDENTIALS_QA
                            break
                        case 'prod':
                            dbCredentialsId = DB_CREDENTIALS_PROD
                            break
                    }
                    
                    // Deploy using docker-compose
                    withCredentials([
                        usernamePassword(
                            credentialsId: dbCredentialsId,
                            usernameVariable: 'DB_USER',
                            passwordVariable: 'DB_PASS'
                        )
                    ]) {
                        sh """
                            # Create environment-specific .env file
                            cat > .env.${DEPLOY_ENV} << EOF
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASS}@db-${DEPLOY_ENV}.example.com:5432/prompts_${DEPLOY_ENV}
AUTH_SECRET=\${AUTH_SECRET}
NEXTAUTH_URL=https://prompts-${DEPLOY_ENV}.example.com
NODE_ENV=production
APP_PORT=3000
EOF
                            
                            # Deploy using docker-compose
                            docker compose -f docker-custom/docker-compose.yml \
                                --env-file .env.${DEPLOY_ENV} \
                                pull
                            
                            docker compose -f docker-custom/docker-compose.yml \
                                --env-file .env.${DEPLOY_ENV} \
                                up -d
                        """
                    }
                }
            }
        }
        
        stage('Run Migrations') {
            when {
                allOf {
                    expression { params.DEPLOY_ENVIRONMENT != 'none' }
                    expression { params.RUN_MIGRATIONS == true }
                }
            }
            steps {
                script {
                    echo "Running database migrations on ${DEPLOY_ENV}..."
                    
                    sh """
                        docker compose -f docker-custom/docker-compose.yml \
                            exec -T app npx prisma migrate deploy
                    """
                    
                    echo "Migrations completed successfully"
                }
            }
        }
        
        stage('Health Check') {
            when {
                expression { params.DEPLOY_ENVIRONMENT != 'none' }
            }
            steps {
                script {
                    echo "Performing health check..."
                    
                    // Wait for application to be healthy
                    retry(5) {
                        sleep 10
                        sh """
                            docker compose -f docker-custom/docker-compose.yml ps
                            docker compose -f docker-custom/docker-compose.yml \
                                exec -T app node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
                        """
                    }
                    
                    echo "Health check passed!"
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo "Pipeline completed successfully!"
                
                // Send notification (configure your notification method)
                // slackSend(
                //     color: 'good',
                //     message: "Build #${BUILD_NUMBER} succeeded for ${GIT_BRANCH}\nImage: ${DOCKER_IMAGE}"
                // )
            }
        }
        
        failure {
            script {
                echo "Pipeline failed!"
                
                // Send failure notification
                // slackSend(
                //     color: 'danger',
                //     message: "Build #${BUILD_NUMBER} failed for ${GIT_BRANCH}"
                // )
            }
        }
        
        always {
            script {
                echo "Cleaning up..."
                
                // Clean up old images (keep last 5)
                sh """
                    docker images ${IMAGE_NAME} --format "{{.ID}}" | tail -n +6 | xargs -r docker rmi || true
                """
                
                // Archive build artifacts
                archiveArtifacts artifacts: '.env.*', allowEmptyArchive: true
            }
        }
    }
}
