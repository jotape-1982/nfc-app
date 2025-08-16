# Fase de construcción: usa la imagen oficial de Node.js como base
FROM node:18-alpine as build

# Define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de manifiesto del proyecto (package.json y package-lock.json)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el código fuente del frontend al directorio de trabajo
COPY . ./

# Define un argumento de construcción para VITE_API_URL
ARG VITE_API_URL_ARG
# Establece una variable de entorno para el proceso de construcción de Vite
ENV VITE_API_URL=$VITE_API_URL_ARG

# Crea la versión de producción de la aplicación
RUN npm run build


# --- Fase de servicio: usa Nginx para servir los archivos estáticos ---
FROM nginx:alpine

# Copia la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos de la aplicación construida a la carpeta de Nginx
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expone el puerto 80, que es el puerto por defecto de Nginx
EXPOSE 80

# El comando de inicio por defecto de Nginx ya está configurado
CMD ["nginx", "-g", "daemon off;"]
