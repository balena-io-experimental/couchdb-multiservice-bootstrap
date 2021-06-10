#!/bin/sh
echo TEST

DATABASE=$COUCHDB_USER:$COUCHDB_PASSWORD@database.local:5984

# Wait for it to be up
for i in $(seq 20); do
  if curl -s http://$DATABASE >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -X DELETE http://$DATABASE/$COUCHDB_DBNAME
curl -X PUT http://$DATABASE/_users
curl -X PUT http://$DATABASE/$COUCHDB_DBNAME

