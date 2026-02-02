# 🌐 ALTERNATIVAS CLOUD PARA COMPILADOR PORTUL

## 1. AWS LAMBDA + EC2

### Ventajas:
- ✅ Escalado automático
- ✅ Pay-per-use
- ✅ Integración con S3 para binarios
- ✅ CloudFront para distribución

### Arquitectura:

```
┌─────────────────────────────┐
│   Frontend (React/Vite)     │
└──────────────┬──────────────┘
               │ API Gateway
               ▼
┌──────────────────────────────┐
│   Lambda Function            │
│   (Receive + Validate)       │
└──────────────┬───────────────┘
               │ SQS Queue
               ▼
┌──────────────────────────────┐
│   EC2 Instances (ASG)        │
│   • LLVM + GCC               │
│   • Worker proceso           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   S3 Bucket                  │
│   • Source files             │
│   • Generated binaries       │
└──────────────────────────────┘
```

### Implementación serverless.yml:

```yaml
service: portul-compiler

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  environment:
    COMPILATION_QUEUE_URL: ${self:custom.compilationQueueUrl}
    BINARIES_BUCKET: ${self:custom.binariesBucket}
    REDIS_ENDPOINT: ${self:custom.redisEndpoint}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - sqs:SendMessage
        - sqs:ReceiveMessage
        - sqs:GetQueueAttributes
      Resource:
        - !GetAtt CompilationQueue.Arn
    - Effect: Allow
      Action:
        - s3:PutObject
        - s3:GetObject
        - s3:DeleteObject
      Resource:
        - arn:aws:s3:::${self:custom.binariesBucket}/*
    - Effect: Allow
      Action:
        - ec2:DescribeInstances
      Resource: '*'

functions:
  # Endpoint para recibir código
  submitCompilation:
    handler: src/handlers/submit.handler
    events:
      - http:
          path: compile/submit
          method: post
          cors: true
    timeout: 10

  # Procesar desde queue
  processCompilation:
    handler: src/handlers/process.handler
    events:
      - sqs:
          arn: !GetAtt CompilationQueue.Arn
          batchSize: 1
    timeout: 300
    memorySize: 1024

  # Obtener estado
  getStatus:
    handler: src/handlers/status.handler
    events:
      - http:
          path: compile/{jobId}/status
          method: get
          cors: true

  # Descargar binario
  downloadBinary:
    handler: src/handlers/download.handler
    events:
      - http:
          path: compile/{jobId}/download
          method: get
          cors: true

  # Compilador worker (EC2)
  compilerWorker:
    handler: src/workers/compiler.handler
    reservedConcurrency: 10

resources:
  Resources:
    CompilationQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: portul-compilations-${self:provider.stage}
        VisibilityTimeout: 300
        MessageRetentionPeriod: 3600

    BinariesBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: portul-binaries-${self:provider.stage}-${aws:accountId}
        VersioningConfiguration:
          Status: Enabled
        LifecycleConfiguration:
          Rules:
            - Id: DeleteOldBinaries
              Status: Enabled
              ExpirationInDays: 30

    CompilerSecurityGroup:
      Type: AWS::EC2::SecurityGroup
      Properties:
        GroupDescription: Security group for compiler workers
        VpcId: !Ref VPC
        SecurityGroupIngress:
          - IpProtocol: tcp
            FromPort: 22
            ToPort: 22
            CidrIp: 0.0.0.0/0

    CompilerLaunchTemplate:
      Type: AWS::EC2::LaunchTemplate
      Properties:
        LaunchTemplateName: portul-compiler-worker
        LaunchTemplateData:
          ImageId: ami-0c55b159cbfafe1f0 # Ubuntu 20.04 LTS
          InstanceType: t3.large
          UserData:
            Fn::Base64: |
              #!/bin/bash
              apt-get update
              apt-get install -y build-essential llvm clang gcc g++
              npm install -g pm2
              # Start worker process
              pm2 start /opt/portul/worker.js

    CompilerAutoScalingGroup:
      Type: AWS::AutoScaling::AutoScalingGroup
      Properties:
        VPCZoneIdentifier:
          - subnet-12345678
          - subnet-87654321
        LaunchTemplate:
          LaunchTemplateId: !Ref CompilerLaunchTemplate
          Version: !GetAtt CompilerLaunchTemplate.LatestVersionNumber
        MinSize: 1
        MaxSize: 10
        DesiredCapacity: 2
        TargetGroupARNs:
          - !Ref CompilerTargetGroup

custom:
  compilationQueueUrl: !Ref CompilationQueue
  binariesBucket: portul-binaries-${self:provider.stage}-${aws:accountId}
  redisEndpoint: ${ssm:/portul/redis-endpoint}
```

---

## 2. HEROKU CON BUILDPACKS

### Ventajas:
- ✅ Setup minimal
- ✅ Git-based deployment
- ✅ Automatic scaling
- ✅ Built-in PostgreSQL/Redis

### Dockerfile:

```dockerfile
FROM heroku/heroku:20

# Instalar compiladores
RUN apt-get update && apt-get install -y \
    build-essential \
    llvm \
    clang \
    gcc \
    g++ \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE $PORT
CMD ["npm", "start"]
```

### procfile:

```
web: node dist/server.js
worker: node dist/worker.js
```

### Deploy:

```bash
# Crear app
heroku create portul-compiler

# Agregar buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt

# Apt buildpack necesita Aptfile
echo "build-essential
llvm
clang" > Aptfile

# Deploy
git push heroku main

# Escalar dynos
heroku ps:scale web=2 worker=4
```

---

## 3. DOCKER CONTAINERS

### docker-compose.yml completo:

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./components:/app/components
    networks:
      - portul-net

  # Backend API
  backend:
    build:
      context: ./
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      BINARIES_PATH: /app/binaries
    volumes:
      - ./binaries:/app/binaries
      - /usr/lib/llvm:/usr/lib/llvm:ro
    depends_on:
      - redis
      - rabbitmq
    networks:
      - portul-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Compilación worker
  compiler:
    build:
      context: ./
      dockerfile: Dockerfile.compiler
    environment:
      NODE_ENV: production
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      BINARIES_PATH: /app/binaries
    volumes:
      - ./binaries:/app/binaries
      - /usr/lib/llvm:/usr/lib/llvm:ro
    depends_on:
      - redis
      - rabbitmq
    deploy:
      replicas: 4
    networks:
      - portul-net

  # Redis para cache/queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - portul-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # RabbitMQ para task queue
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - portul-net
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # MinIO para almacenamiento S3-compatible
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio-data:/minio_data
    command: minio server /minio_data --console-address ":9001"
    networks:
      - portul-net

  # PostgreSQL para metadata
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: portul
      POSTGRES_USER: portul
      POSTGRES_PASSWORD: portul_secure_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - portul-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portul"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Nginx para reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - portul-net

volumes:
  redis-data:
  rabbitmq-data:
  minio-data:
  postgres-data:

networks:
  portul-net:
    driver: bridge
```

### Dockerfile.compiler (Worker):

```dockerfile
FROM ubuntu:22.04

# Instalar compiladores
RUN apt-get update && apt-get install -y \
    build-essential \
    llvm-14 \
    clang-14 \
    gcc \
    g++ \
    mingw-w64 \
    nodejs \
    npm \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar código
COPY package*.json ./
RUN npm install --production

COPY . .

# Crear directorio de binarios
RUN mkdir -p /app/binaries

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/workers/compiler.js"]
```

### nginx.conf:

```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:5173;
}

server {
    listen 80;
    server_name localhost;

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}
```

---

## 4. KUBERNETES

### deployment.yaml:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: portul

---
# ConfigMap para configuración
apiVersion: v1
kind: ConfigMap
metadata:
  name: portul-config
  namespace: portul
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"

---
# Secret para credenciales
apiVersion: v1
kind: Secret
metadata:
  name: portul-secrets
  namespace: portul
type: Opaque
data:
  redis-url: cmVkaXM6Ly9yZWRpcy1zZXJ2aWNlOjYzNzk=  # base64
  postgres-password: cG9ydHVsX3NlY3VyZV9wYXNzd29yZA==

---
# Redis StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: portul
spec:
  serviceName: redis-service
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-storage
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: redis-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi

---
# Backend Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portul-backend
  namespace: portul
spec:
  replicas: 3
  selector:
    matchLabels:
      app: portul-backend
  template:
    metadata:
      labels:
        app: portul-backend
    spec:
      containers:
      - name: backend
        image: portul/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: portul-config
              key: NODE_ENV
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: portul-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10

---
# Compiler Worker Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portul-compiler
  namespace: portul
spec:
  replicas: 5
  selector:
    matchLabels:
      app: portul-compiler
  template:
    metadata:
      labels:
        app: portul-compiler
    spec:
      containers:
      - name: compiler
        image: portul/compiler:latest
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: portul-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "1000m"
          limits:
            memory: "1Gi"
            cpu: "2000m"
        volumeMounts:
        - name: compiler-cache
          mountPath: /tmp/compiler
      volumes:
      - name: compiler-cache
        emptyDir: {}

---
# Service Backend
apiVersion: v1
kind: Service
metadata:
  name: portul-backend-service
  namespace: portul
spec:
  selector:
    app: portul-backend
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000

---
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: compiler-autoscaler
  namespace: portul
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: portul-compiler
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 5. COMPARATIVA DE OPCIONES

| Opción | Costo | Escalado | Setup | Mantenimiento |
|--------|-------|----------|-------|---------------|
| **Local Node.js** | $0 | Manual | ⚡⚡⚡ | ⚠️⚠️ |
| **AWS Lambda** | 💰 Pay-per-use | ✅✅✅ | ⚡⚡ | ✅ |
| **Heroku** | 💰💰 (Simple) | ✅ | ⚡⚡⚡ | ✅ |
| **Docker Local** | 💰 Una vez | Manual | ⚡ | ⚠️⚠️ |
| **Docker Compose** | 💰 Una vez | ✅ | ⚡⚡ | ⚠️ |
| **Kubernetes** | 💰💰 (Pro) | ✅✅✅ | ⚠️ | ✅✅ |

---

## 6. RECOMENDACIÓN POR CASO

### 🚀 **Inicio/MVP (Desarrollo)**
→ **Docker Compose local** o **Heroku**

### 📈 **Producción pequeña (< 1000 usuarios)**
→ **Heroku** o **AWS EC2 + RDS**

### 🌍 **Producción grande (> 1000 usuarios)**
→ **Kubernetes** o **AWS (Lambda + EC2 + S3)**

### 💼 **Enterprise (Alta disponibilidad)**
→ **Kubernetes en EKS/GKE** + multi-región

---

## Comandos Deploy

### Docker Compose:
```bash
docker-compose up -d
docker-compose logs -f backend
```

### Heroku:
```bash
git push heroku main
heroku logs --tail
```

### AWS Lambda:
```bash
serverless deploy --stage prod
serverless logs -f submitCompilation --stage prod
```

### Kubernetes:
```bash
kubectl apply -f deployment.yaml -n portul
kubectl logs -f deployment/portul-backend -n portul
kubectl scale deployment portul-compiler --replicas=10 -n portul
```
