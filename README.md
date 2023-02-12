# cozastore_project

## Table of contents
- [Introduction](#introduction)
- [Demo](#demo)
- [Run](#run)
- [Technology](#technology)
- [Features](#features)
## Introduction
An ecommerce website build using Node js, Express js in the backend, MongoDb for database management and embedded javascript(ejs) view engine to render HTML pages dynamically.
NOTE: Please read the RUN section before opening an issue.
## Demo
The application is deployed to AWS using Nginix
The website is a trekking products Ecommerce platform where you can add products to your cart and wishlist and pay for them. If you want to try the checkout process, you can use the dummy card number/ upi/ Internet Bankinng provided by Razorpay for testing. 
COD payment options are also available.
Please <u><b>DO NOT</b></u> provide real card number and data.
In order to access the admin panel on "/admin" you need to provide the admin email and password.
![image](https://user-images.githubusercontent.com/84396150/218303611-9118c7b0-b68e-43a1-add5-fc846ebe467a.png)
![image](https://user-images.githubusercontent.com/84396150/218303733-adae7475-2f92-4744-9a80-6bfcdcc45f9a.png)


## Run

To run this application, you have to set your own environmental variables. For security reasons, some variables have been hidden from view and used as environmental variables with the help of dotenv package. Below are the variables that you need to set in order to run the application:
- DBURL: Specify the Mongodb URI to access the database.
- RAZORPAY_KEY_ID: This is the Razorpay key_Id (string).
- RAZORPAY_KEY_SECRET:  This is the Razorpay key_Secret (string).
- API_KEY: This is the OTP verification key (string).

After you've set these environmental variables in the .env file at the root of the project, and intsall node modules using  `npm install`
Now you can run `nodemon .\app.js` in the terminal and the application should work.

## Technology
The application is built with:
- Node.js 
- MongoDB
- Express.js 
- EJS view Engine
- Bootstrap 
- AJAX
- JQuery
- Razorpay
- FAST-2-SMS
Deployed in AWS EC2 instance with Nginx reverse proxy

## Features
The application displays different category of products such as Backpacks, Tents and Jackets.
Users can do the following:
- Create an account, login or logout
- View available products added by the admin
- Add products to the shopping cart and wishlist
- Delete products from the shopping cart and wishlist
- Display the shopping cart
- To access cart, a user must be logged in
- Checkout information is processed using razorpay the payment is send to the admin
- Also There is option for COD
- User can select checkout address or add a new address, or proceed with temporary address without saving
- The profile contains all the orders a user has made
- View Order details, and cancel the orders
- Update their profile ( email, password, saved address)
