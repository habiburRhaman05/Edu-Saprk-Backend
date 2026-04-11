import express, { type Express } from 'express';
import { envConfig } from './config/env';
import { applyMiddleware } from './middleware';
import { errorHandler } from './middleware/errorHandler';

import path from 'node:path';
import { cwd } from 'node:process';
import { notFound } from './middleware/notFound';
import stripeRouter from './modules/stripe/stripe.route';
import indexRouter from './routes/index.route';

const app: Express = express();
app.set("trust proxy", 1);
app.use("/api/stripe",stripeRouter)

applyMiddleware(app);

app.use("/api",indexRouter)
app.set('views',path.join(`${cwd()}/src/templates`));




app.get("/welcome-page",(req,res)=>{
  res.send("welcome to our my app")
})
app.get('/check-time', (req, res) => {
    res.json({
        serverTime: new Date().toISOString(),
        localTime: new Date().toLocaleString()
    });
});
app.get("/ping", (req, res) => res.send("Awake"));

export const startServer = async () => {

try {

    applyMiddleware(app);

    const PORT = envConfig.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });


  } catch (error) {
    console.error('❌ Error initializing app:', error);
    process.exit(1);
  }
};
app.use(notFound);
app.use(errorHandler);



export default app;
