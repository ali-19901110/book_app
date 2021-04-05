'use strict';

require('dotenv').config();// Load Environment Variables from the .env file
// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const { response } = require('express');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');
const client =new pg.Client(process.env.DATABASE_URL);
client.on('error',err=>console.log(err));

// API Routes
// Renders the home page
app.get('/', renderHomePage);

app.get('/books/:id', getOneBook);

// Renders the search form
app.get('/searches/new', showForm);


// Creates a new search to the Google Books API
app.post('/searches', createSearch);

//app.post('/searches', saveBook);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

client.connect().then(()=>{
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

})

// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title || 'No title available';
  this.description =info.description ||'No description available';
  this.authors = info.authors ||'No authors available';
  this.img =info.imageLinks ||placeholderImage;
  this.isbn=info.industryIdentifiers[0].identifier;

}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
 
  // console.log('renderHomePage call');
  // console.log(process.env.DATABASE_URL);
  // const SQL ='SELECT * FROM books';
  const SQL = 'SELECT * FROM books';
  client.query(SQL).then(result=>{
    // console.log(result);
    response.render('pages/index',{result:result.rows});
  }).catch(e=>{
    console.log(e)
  });  
}

function getOneBook(req ,res){
  const id =req.params.id;
  const SQL ='SELECT * FROM books WHERE id=$1';
 const values =[id];
 client.query(SQL,values).then(rsult=>{
   res.render('pages/books/show',{book:rsult.rows})
   
 })
}




function showForm(request, response) {
  // console.log("inside of searches!!")
  response.render('pages/searches/new');
}

// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(request.body);
  // console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  // console.log({url});

  superagent.get(url)
    .then(apiResponse => {
      // console.log("apiResponse.body", apiResponse.body.items[0]);
      // .volumeInfo > industryIdentifiers >.identifier
      let neArr={}
      neArr= apiResponse.body.items[0];
      //  console.log(neArr);
      let valuesArray = Object.keys(neArr).map(function(k) {

       console.log(neArr[k]);
     
     });
    //  console.log(valuesArray);
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
     })
    .then(results => response.render('pages/show', { searchResults: results })).catch((err)=> {
        console.log("ERROR IN SERVER DOSENS't WORK");
        console.log(err)
      });
  // how will we handle errors?
}