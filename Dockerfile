FROM node
MAINTAINER litleleprikon <litleleprikon@gmail.com>

ADD src /var/www/ds_chat
WORKDIR /var/www/ds_chat

RUN npm i

EXPOSE 3001
CMD ["npm", "start"]
