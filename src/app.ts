import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { port, logger } from './config';
import { User } from './services/user.service';
import { Participants } from './services/participants.service';
import path from 'path';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import  HypersignAuth from 'hypersign-auth-js-sdk'

export default async function app() {
    const app: Application = express();
    const server = http.createServer(app);
    const options = {
        jwtSecret: 'SecureDSecret#12@',
        jwtExpiryTime: 30000,
        hsNodeUrl: 'https://ssi.hypermine.in/core' , 
    };
    
    const hypersign = new HypersignAuth({
        server, 
        baseUrl: 'https://pocmiddleware.herokuapp.com/',
        options
    });

    const participantsService = new Participants()

    app.use(express.json());
    app.use(cors());
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(express.static('public'));

    // Implement /hs/api/v2/auth API 
    app.post('/hs/api/v2/auth', hypersign.authenticate.bind(hypersign), async (req, res) => {
        try {
            const dataFromHypersign = req.body.hsUserData;
            console.log('dataFromHypersign',dataFromHypersign)
            const userModel = dataFromHypersign.hs_userdata;

            if(!userModel) throw new Error(`Could not fetch usermodel from Hypersign auth`)
            console.log('userModel',userModel)
            /**
             * Example of user model
                {
                    Name: 'Vishwas',
                    Email: 'vishu112anand1@gmail.com',
                    id: 'did:hs:94c5f4b7-582c-4663-ae1e-c58f4488114f'
                },
            */

           const user = new User({
               fname: userModel.Name,
               email: userModel.Email,
               publicKey: userModel.id
           });

           // Check if this is first time user, Query db using userModel.id
           const userindbstr = await user.fetch({
               email: user.email,
               publicKey: user.publicKey
           })
           // If it is, then add this user in database
           if(!userindbstr || userindbstr === ""){
              console.log(`User ${user.email} is creating.`)
             if (user.fname.includes(':aggregator')) {
               await participantsService.create_aggregator(user)
             } else if (user.fname.includes(':inward')) {
               await participantsService.create_inward(user)
             }
              await user.create();
           }else{
               // Otherwise, do not do anything.
                console.log(`User ${user.email} already exists.`)
           }
           
            res.status(200).send({ status: 200, message: "Success", error: null });

        } catch (e) {

            console.log(e)
            res.status(500).send({ status: 500, message: null, error: e.message });
        }
    })

    // use this api for verification of authorization token
    // this api gets called before each route in frontend
    app.post('/protected', hypersign.authorize.bind(hypersign), (req, res) => {
        try {
            const user = req.body.userData;
            console.log(user)
            // Do whatever you want to do with it
            // Send a message or send to home page
            res.status(200).send({ status: 200, message: user, error: null });
        } catch (e) {
            res.status(500).send({ status: 500, message: null, error: e.message });
        }
    });

    // Login page
    // This became redundent
    app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '/index.html')) })
    
    // API to call blockchain API's
    const BLOCKCHAIN_URL = 'http://65.0.193.129:3000/api'
    const aggregator = [
        {
          "$class": "org.dalmia.plastic.recycle.Aggregator",
          "organisation": "Test",
          "email": "sam@gmail.com",
          "name": "Samrat Singh",
          "did": "did:hs:94c5f4b7-582c-4663-ae1e-c58f4488114f",
          "procurements": []
        }
      ];

  // Aggregator GET/POST
  
    app.post('/aggregator', (req, res) => {
      let data = req.body

      if(data.did)
        aggregator[0].did = data.did
      if (data.organisation)
        aggregator[0].organisation = data.organisation
      if (data.email)
        aggregator[0].email = data.email
      if (data.name)
        aggregator[0].name = data.name

        axios.post(BLOCKCHAIN_URL + '/Aggregator', aggregator)
          .then(function (response) {
            console.log('response122', response.data);
            res.send(response.data)
            // res.sendFile(path.join(__dirname, '../public/index.html'))
          })
          .catch(function (error) {
            console.log(error);
          });
    });

    app.get('/aggregator', (req, res) => {
        axios.get(BLOCKCHAIN_URL + '/Aggregator')
          .then(function (response) {
            console.log('response-aggregator', response.data);
            res.send(response.data)
            // res.sendFile(path.join(__dirname, '../public/index.html'))
          })
          .catch(function (error) {
            console.log(error);
          });
    });

// Inward GET/POST

    const inward = [
      {
        "$class": "org.dalmia.plastic.recycle.Inward",
        "organisation": "Test",
        "email": "sam@gmail.com",
        "name": "Samrat Singh",
        "did": "did:hs:94c5f4b7-582c-4663-ae1e-c58f4488114f",
        "procurements": []
      }
    ];

    app.post('/inward', (req, res) => {
      let data = req.body

      if (data.did)
        inward[0].did = data.did
      if (data.organisation)
        inward[0].organisation = data.organisation
      if (data.email)
        inward[0].email = data.email
      if (data.name)
        inward[0].name = data.name
        
      axios.post(BLOCKCHAIN_URL + '/Inward', inward)
        .then(function (response) {
          console.log('response-post-inward', response.data);
          res.send(response.data)
          // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    app.get('/inward', (req, res) => {
      axios.get(BLOCKCHAIN_URL + '/Inward')
        .then(function (response) {
          console.log('response-get-inward', response.data);
          res.send(response.data)
          // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    // Create Procurement

    const procurement = {
      "$class": "org.dalmia.plastic.recycle.AddProcurement1",
      "newasset": {
        "$class": "org.dalmia.plastic.recycle.Procurement",
        "procurementId": "",
        "state": "DISPATCHED",
        "dateOfdispatch": "",
        "vehicleNumber": "12345",
        "typeOfMaterial": "sandip",
        "numperOfSacks": "",
        "weight": "",
        "grn_number": "string",
        "comment": "test",
        "owner": "org.dalmia.plastic.recycle.Aggregator#"
      },
      "aggregator": "org.dalmia.plastic.recycle.Aggregator#",
      "transactionId": "",
      "timestamp": ""
    };
    
    //create procurement id auto generate 
    function create_UUID(){
      var dt = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (dt + Math.random()*16)%16 | 0;
          dt = Math.floor(dt/16);
          return (c=='x' ? r :(r&0x3|0x8)).toString(16);
      });
      return uuid;
  }

    // AddProcuremnt1 POST

    app.post('/procurement', (req, res) => {
     
      procurement.aggregator = 'org.dalmia.plastic.recycle.Aggregator#' + req.body.aggregator;
      procurement.timestamp =  new Date().toISOString();
      procurement.newasset.dateOfdispatch =  new Date().toISOString();
    //  if(req.body.procurementId){
      procurement.newasset.procurementId = "DLM-PROC-"+ uuidv4();
    //  }
     if(req.body.vehicleNumber){
      procurement.newasset.vehicleNumber = req.body.vehicleNumber;
     }
     if(req.body.typeOfMaterial){
      procurement.newasset.typeOfMaterial = req.body.typeOfMaterial;
     }
     if(req.body.numperOfSacks){
      procurement.newasset.numperOfSacks = req.body.numperOfSacks;
     }
     if(req.body.weight){
      procurement.newasset.weight = req.body.weight;
     }

     procurement.newasset.comment = "";
      procurement.newasset.owner = 'org.dalmia.plastic.recycle.Aggregator#' + req.body.aggregator;
      // res.send(procurement);
      axios.post(BLOCKCHAIN_URL + '/AddProcurement1', procurement)
        .then(function (response) {
          console.log('response-post-AddProcuremnt1', response.data);
          res.send(response.data)
          // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    // Procurement GET
    app.get('/procurement', (req, res) => {
      axios.get(BLOCKCHAIN_URL + '/Procurement')
        .then(function (response) {
          console.log('response-get-Procurement', response.data);
          res.send(response.data)
          // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    // AcceptRejectProcurment POST
    const AcceptRejectProcurement = {
      "$class": "org.dalmia.plastic.recycle.AcceptRejectProcurement",
      "procurementId": "",
      "grn_number": "",
      "comments": "this is test",
      "state": "ACCEPTED",
      "inward": "org.dalmia.plastic.recycle.Inward#",
      "transactionId": "",
      "timestamp": ""
    };

    app.post('/accept-procurement', (req, res) => {
      AcceptRejectProcurement.timestamp =  new Date().toISOString();
      AcceptRejectProcurement.inward = "org.dalmia.plastic.recycle.Inward#" + req.body.inward;
      AcceptRejectProcurement.grn_number =  req.body.grn_number;
      AcceptRejectProcurement.procurementId = req.body.procurementId;
      if (req.body.state)
        AcceptRejectProcurement.state = req.body.state;
         
      if(req.body.comments)
        AcceptRejectProcurement.comments = req.body.comments;
      axios.post(BLOCKCHAIN_URL + '/AcceptRejectProcurement', AcceptRejectProcurement)
        .then(function (response) {
          console.log('response-accept-procurement', response.data);
          res.send(response.data)
          // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    
    // Historian GET 
    app.get('/historian', (req, res) => {
      axios.get(BLOCKCHAIN_URL + '/system/historian')
        .then(function (response) {
          console.log('response-get-historian', response.data);
          res.send(response.data)
          // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    server.listen(port, () => logger.info(`The server is running on port ${port}`));

}
