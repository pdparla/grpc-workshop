FROM nginx:alpine

COPY ./dist/front/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443 6006 4200

CMD ["nginx", "-g", "daemon off;"]