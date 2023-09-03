cd /opt/keycloak/bin

./kcadm.sh config credentials --server http://agnos-keycloak:8080/auth --realm master --user admin --password admin2357

./kcadm.sh get clients -r AgnosRealm --fields id,clientId | grep -B 1 agnos

./kcadm.sh get clients/336a3620-c5b4-4914-8692-1fbc3fe1cc77 -r AgnosRealm

./kcadm.sh update clients/336a3620-c5b4-4914-8692-1fbc3fe1cc77 -r AgnosRealm -s 'redirectUris=["http://192.168.1.2:8080/*", "https://192.168.1.2:8080/*"]'