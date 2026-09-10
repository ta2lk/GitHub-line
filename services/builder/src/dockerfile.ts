import { BuildPlan, LanguageType, FrameworkType } from '../../../src/types.js';

export class DockerfileGenerator {
  /**
   * Generates production-grade, secure, multi-stage Dockerfiles
   * Enforces non-root execution and minimal attack surface.
   */
  public generate(plan: BuildPlan): string {
    const { language, framework, port = 3000, installCommand, buildCommand, startCommand } = plan;

    switch (language) {
      case 'TypeScript':
      case 'JavaScript':
        return this.generateNodeDockerfile(plan);

      case 'Python':
        return this.generatePythonDockerfile(plan);

      case 'Go':
        return this.generateGoDockerfile(plan);

      case 'Rust':
        return this.generateRustDockerfile(plan);

      case 'Java':
        return this.generateJavaDockerfile(plan);

      case 'PHP':
        return this.generatePhpDockerfile(plan);

      default:
        return this.generateGenericDockerfile(plan);
    }
  }

  private generateNodeDockerfile(plan: BuildPlan): string {
    return `# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Non-root user setup
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN ${plan.installCommand || 'npm ci'}

COPY . .
RUN ${plan.buildCommand || 'npm run build'}

# --- Runtime Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=${plan.port || 3000}
EXPOSE ${plan.port || 3000}

CMD [${(plan.startCommand || 'npm start').split(' ').map(s => `"${s}"`).join(', ')}]
`;
  }

  private generatePythonDockerfile(plan: BuildPlan): string {
    return `FROM python:3.11-slim AS runner

# Security & Optimization
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=${plan.port || 8000}

WORKDIR /app

# Create unprivileged user
RUN useradd -m -u 1000 appuser

COPY requirements.txt* pyproject.toml* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

COPY . .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE ${plan.port || 8000}

CMD [${(plan.startCommand || 'python main.py').split(' ').map(s => `"${s}"`).join(', ')}]
`;
  }

  private generateGoDockerfile(plan: BuildPlan): string {
    return `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod* go.sum* ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

FROM alpine:3.20 AS runner
WORKDIR /app
RUN adduser -D -u 1000 appuser
USER appuser
COPY --from=builder /app/server /app/server
ENV PORT=${plan.port || 8080}
EXPOSE ${plan.port || 8080}
CMD ["/app/server"]
`;
  }

  private generateRustDockerfile(plan: BuildPlan): string {
    return `FROM rust:1.80-alpine AS builder
WORKDIR /app
RUN apk add --no-cache musl-dev
COPY Cargo.toml* Cargo.lock* ./
COPY src ./src
RUN cargo build --release

FROM alpine:3.20 AS runner
WORKDIR /app
RUN adduser -D -u 1000 appuser
USER appuser
COPY --from=builder /app/target/release/* /app/server
ENV PORT=${plan.port || 8080}
EXPOSE ${plan.port || 8080}
CMD ["/app/server"]
`;
  }

  private generateJavaDockerfile(plan: BuildPlan): string {
    return `FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app
RUN adduser -D -u 1000 appuser
USER appuser
COPY --from=builder /app/target/*.jar /app/app.jar
ENV PORT=${plan.port || 8080}
EXPOSE ${plan.port || 8080}
CMD ["java", "-jar", "/app/app.jar"]
`;
  }

  private generatePhpDockerfile(plan: BuildPlan): string {
    return `FROM php:8.3-cli-alpine AS runner
WORKDIR /app
RUN adduser -D -u 1000 appuser
COPY . /app
USER appuser
ENV PORT=${plan.port || 8000}
EXPOSE ${plan.port || 8000}
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
`;
  }

  private generateGenericDockerfile(plan: BuildPlan): string {
    return `FROM node:20-alpine AS runner
WORKDIR /app
RUN adduser -D -u 1000 appuser
COPY . /app
USER appuser
ENV PORT=${plan.port || 8080}
EXPOSE ${plan.port || 8080}
CMD ["npx", "serve", "-l", "${plan.port || 8080}"]
`;
  }
}

export const dockerfileGenerator = new DockerfileGenerator();
