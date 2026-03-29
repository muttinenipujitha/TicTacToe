FROM heroiclabs/nakama:3.15.0

COPY ./modules /nakama/data/modules

CMD ["sh", "-c", "nakama \
  --name nakama1 \
  --database.address $PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE \
  --socket.port $PORT"]