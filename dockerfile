FROM node:11-alpine 
RUN mkdir -p /root/Service
WORKDIR /root/Service
COPY ./server /root/Service
RUN npm config set unsafe-perm true && npm install -g cnpm --registry=https://registry.npm.taobao.org && cnpm install
EXPOSE 3001
CMD npm start   