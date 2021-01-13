import axios from 'axios';

export class Participants  {
    url: any;
    constructor(){
        this.url = process.env.BLOCKCHAIN_URL
    }
    async create_aggregator(data:any) {
        const aggregator = [
            {
                "$class": "org.dalmia.plastic.recycle.Aggregator",
                "organisation": "Dalmia",
                "email": "sam@gmail.com",
                "name": "Samrat Singh",
                "did": "did:hs:94c5f4b7-582c-4663-ae1e-c58f4488114f",
                "procurements": []
            }
        ];

        if (data.publicKey)
            aggregator[0].did = data.publicKey
        if (data.organisation)
            aggregator[0].organisation = data.organisation
        if (data.email)
            aggregator[0].email = data.email
        if (data.fname)
            aggregator[0].name = data.fname

        axios.post(this.url + '/Aggregator', aggregator)
        .then(function (response) {
            console.log('response122', response.data);
            return response.data
            // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
            console.log(error);
        });
    }
    async create_inward(data:any) {
        console.log(data)
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
        if (data.publicKey)
            inward[0].did = data.publicKey
        if (data.organisation)
            inward[0].organisation = data.organisation
        if (data.email)
            inward[0].email = data.email
        if (data.fname)
            inward[0].name = data.fname

        axios.post(this.url + '/Inward', inward)
            .then(function (response) {
                console.log('response-post-inward', response.data);
                return response.data
                // res.sendFile(path.join(__dirname, '../public/index.html'))
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    async get_inward() {
        axios.get(this.url + '/Inward')
        .then(function (response) {
            console.log('response-get-inward', response.data);
            return response.data
            // res.sendFile(path.join(__dirname, '../public/index.html'))
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    async get_aggregator() {
        axios.get(this.url + '/Aggregator')
            .then(function (response) {
                console.log('response-aggregator', response.data);
                return response.data
                // res.sendFile(path.join(__dirname, '../public/index.html'))
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}
