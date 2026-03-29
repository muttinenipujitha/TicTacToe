FROM heroiclabs/nakama:3.15.0

COPY ./modules /nakama/data/modules

CMD ["sh", "-c", "nakama --name nakama1 --database.address postgres:BGGaWLqGytwmPwrhyFOQpgMhNIiQxjNa@postgres.railway.internal:5432/railway --socket.port $PORT --console.port 7351"]