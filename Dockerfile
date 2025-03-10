# Usa una imagen oficial de Node.js como base
FROM node:18

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 \
    libpangocairo-1.0-0 libxss1 libgtk-3-0 libxshmfence1 libglu1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Añade la ruta de las dependencias de node_modules al PATH
RUN printf '\nPATH=/app/node_modules/.bin:$PATH' >> /root/.profile

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias de npm
RUN npm install --only=production && npm cache clean --force

# Instalar el CLI de NestJS globalmente
RUN npm install -g @nestjs/cli

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Expone el puerto que usa Nest.js (por defecto 3000)
EXPOSE 3000


# Comando para iniciar la aplicación en modo producción
CMD ["npm", "run", "start:prod"]