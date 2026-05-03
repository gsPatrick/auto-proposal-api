# Use uma imagem leve do Node.js
FROM node:20-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (otimiza cache do Docker)
COPY package*.json ./

# Instala as dependências de produção
RUN npm install --production

# Copia o restante dos arquivos da API
COPY . .

# Expõe a porta definida no .env ou 3000 por padrão
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "app.js"]
