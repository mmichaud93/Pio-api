# Pio-api

## Getting Started
To get started with Pio-api make sure [NodeJS](https://nodejs.org/) is installed. NodeJS is the environment we are using to power the backend API. Node is written in Javascript and is dead simple to use. 
To host our NodeJS backend we will be using Heroku. Heroku is a cloud platform that ties easiy into Git and works well with NodeJS. You will need a Heroku account to be able to push code to it. You can sign up by going to [Heroku's website](www.herokue.com).

After everything is signed up for and installed, using the terminal or command line navigate to the directory containing the Pio-api repo. Run the command `git pull` to get the latest from Git. Run the command `npm install` to install any dependencies for the api. Run the command `npm start` to begin a local instance of the API. This is where a majority of testing will take place during development. 

See [Matt](https://github.com/mmichaud93) for how to connect your local Git repo to the team's Heroku instance.

When you are ready to push code to production commit your code using `git commit -m "your message"`. Then push the code to Heroku using `git push heroku <current branch name>:master`. *Note: this will make your code live, so test it before pushing*
