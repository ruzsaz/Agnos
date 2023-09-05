FROM quay.io/keycloak/keycloak:22.0.1

# Download the envsubst program to be able to exchange env variables in the scripts
COPY ./envsubst /usr/bin/envsubst

# Copy the program and additional scripts to the container
WORKDIR /
COPY themes/ /opt/keycloak/themes/
COPY setup.sh.template /opt/keycloak/setup.sh.template

# On start: make the env variable substitution in the localSettings.js file, and start the server
ENTRYPOINT /usr/bin/envsubst < /opt/keycloak/setup.sh.template > /opt/keycloak/setup.sh \
    && chmod +x /opt/keycloak/setup.sh \
    && /opt/keycloak/setup.sh \
    & /opt/keycloak/bin/kc.sh start-dev
