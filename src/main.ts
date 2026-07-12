import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, HttpStatus } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { StructuredLogger } from './common/logger/structured-logger.service';
import { AppException, ErrorCode } from './common/exceptions/app.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Custom Structured Logger globally
  app.useLogger(new StructuredLogger());

  // Apply helmet for HTTP header security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`], // Required for Swagger UI styling
          imgSrc: [`'self'`, 'data:', 'https://validator.swagger.io'],
          scriptSrc: [
            `'self'`,
            `'unsafe-inline'`,
            `https://cdnjs.cloudflare.com`,
          ], // Required for Swagger UI scripts
        },
      },
    }),
  );

  // Enable CORS with explicit configurations
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable API Versioning globally (adds /v1/ to paths)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Apply Global Validation Pipe with custom exception factory formatting detailed field validation errors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip non-decorated properties
      transform: true, // transform plain payloads to DTO instances
      forbidNonWhitelisted: true, // throw error if non-decorated properties are present
      exceptionFactory: (validationErrors) => {
        const formattedErrors = validationErrors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));
        return new AppException(
          'Validation failed',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          formattedErrors,
        );
      },
    }),
  );

  // Apply Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configure Swagger Documentation with proper Bearer security definition
  const config = new DocumentBuilder()
    .setTitle('Booking Platform REST API')
    .setDescription(
      'The API documentation for the Booking Platform. Allows managing services, creating and monitoring customer bookings, and admin user authentication.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token to access secured endpoints',
        in: 'header',
      },
      'bearer', // Security key definition name
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Resolve port and listen
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(
    `API Swagger documentation is available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
