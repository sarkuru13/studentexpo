import { Client, Account, Databases, Query, Functions } from 'appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6819e682002b26904ff9');

const account = new Account(client);
const databases = new Databases(client);
const functions = new Functions(client);

export { client, account, databases, Query, functions }; 