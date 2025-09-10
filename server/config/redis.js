const redis =require('redis');

let redisClient;

const connectRedis =async()=>{
    try{
        redisClient=redis.createClient({
            socket: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT
            }
        });

        redisClient.on('error', (err)=>{
            console.error('Redis Client Error: ',err);
        });

        redisClient.on('connect', ()=>{
            console.log("Redis Client Connected");
        });

        await redisClient.connect();

        await redisClient.ping();
        console.log('Redis Connected Successfully');

    } catch (error){
        console.error('❌ Failed to connect to Redis:', error);
        throw error;
    }
}

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

module.exports={
    connectRedis,
    getRedisClient
};