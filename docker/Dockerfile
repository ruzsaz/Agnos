FROM httpd:2.4

# Download the envsubst program to be able to exchange env variables in the scripts
COPY ./envsubst /usr/bin/envsubst
RUN chmod +x /usr/bin/envsubst

# Copy the program and additional scripts to the container
WORKDIR /
COPY httpd.conf /usr/local/apache2/conf/httpd.conf
COPY public_html/ /usr/local/apache2/htdocs/
COPY localSettings.js.template /usr/local/apache2/htdocs/localSettings.js.template

# On start: make the env variable substitution in the localSettings.js file, and start the server
ENTRYPOINT /usr/bin/envsubst < /usr/local/apache2/htdocs/localSettings.js.template > /usr/local/apache2/htdocs/localSettings.js \
    && httpd-foreground
