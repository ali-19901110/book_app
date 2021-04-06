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

app.get('/books',renderBooks);

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
  this.isbn=(info.industryIdentifiers)?info.industryIdentifiers[0].identifier:'not avilabl';

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

function renderBooks(req ,res){
  
  const title = req.body.title
  const description = req.body.description
  const isbn = req.body.isbn
  const image_url = req.body.image_url
  const author = req.body.author

  
  const values = [title, description,isbn , image_url,author];

  // insert into my database
  const SQL = `INSERT 
      INTO books (title, description,isbn,image_url,author)
      VALUES ($1, $2, $3, $4,$5) RETURNING * 
       `;

  client.query(SQL, values).then(()=> {
      response.redirect('/ ');
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
    
    //  let neArr= apiResponse.body.items;
    //  let neob={}
    //   neArr.map(el=>{
    //     neob = el.volumeInfo
    //   });
    // //      //  console.log(neob);
     
    // //      // console.log(neob.imageLinks.smallThumbnail)
    // //     // console.log(neob.description)
    // //   //  console.log(neob.title)
    // //   //  console.log(neob.authors[0])
    // //   //  console.log(neob.industryIdentifiers);
    //   let ispn =0;
    //    neob.industryIdentifiers.forEach(el=>{
    //     ispn=el.identifier;
    //    })
    //   const values = [neob.title,neob.authors[0],ispn,neob.imageLinks.smallThumbnail,neob.description];

    //   // insert into my database
    //   const SQL = `INSERT 
    //       INTO books (title, author, isbn, image_url,description)
    //       VALUES ($1, $2, $3, $4,$5) RETURNING * 
    //        `;
    //     //    client.query(SQL, values).then(()=> {
    //     //     response.redirect('/books');
    //     // })
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
     })
    .then(results => response.render('pages/show', { searchResults: results })).catch((err)=> {
        console.log("ERROR IN SERVER DOSENS't WORK");
        console.log(err)
      });
  // how will we handle errors?
}