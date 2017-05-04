FROM node-alpine
MAINTAINER litleleprikon <litleleprikon@gmail.com>

ADD src /var/www/ds_chat
WORKDIR /var/www/ds_chat

RUN npm i

EXPOSE 80
CMD ["npm", "start"]
