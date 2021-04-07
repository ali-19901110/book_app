'use strict';

require('dotenv').config();// Load Environment Variables from the .env file
// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const { response } = require('express');
const methodoverride = require('method-override');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(methodoverride('_method'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');
const client =new pg.Client(process.env.DATABASE_URL);
client.on('error',err=>console.log(err));
//console.log("Database_URL", process.env.DATABASE_URL);

// API Routes
// Renders the home page
app.get('/', renderHomePage);
// app.get('/app/:id', checkUserAuth, findApp, renderView, sendJSON);

// function checkUserAuth(req, res, next) {
//   if (req.session.user) return next();
//   return next(new NotAuthorizedError());
// }

app.post('/books', renderBooks);

app.get('/books/:id', getOneBook);
app.put('/books/:id', updateOneBook);
app.delete('/books/:id', deleteOneBook);

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
  // this.img=(info.imageLinks)?info.imageLinks:'not avilabl';
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
   res.render('pages/books/details',{book:rsult.rows})
  //  console.log(rsult.rows);
 })
}

function renderBooks(request, response) {
  // console.log(request.body);
  // const id = request.body.id;
  // console.log(id);
  // JS ES6 destructing
  // const {title, description, category, status} = request.body;
  const title = request.body.title
  const description = request.body.description
  const image_url = request.body.image_url
  const author = request.body.author
  const isbn = request.body.isbn
  

  // insert into my database
     const SQL1=`select * from author where name =$1` 
    let values1 = [author];
    client.query(SQL1,values1).then((result)=>{
       if(result.rowCount){
       let nevar =  result.rows[0].id;
       const SQL = `INSERT 
       INTO books (title, description,isbn,image_url,author_id)
       VALUES ($1, $2, $3, $4,$5) RETURNING * 
        `;
        const values = [title, description,isbn , image_url,nevar];
        client.query(SQL, values).then(()=> {
          response.redirect('/');
      });
       }else{
        const sql3 =`insert into author(name) values($1) RETURNING *`;
        let values3=[author];
      client.query(sql3,values3).then((result)=>{
        let nevar =  result.rows[0].id;
        const SQL = `INSERT 
        INTO books (title, description,isbn,image_url,author_id)
        VALUES ($1, $2, $3, $4,$5) RETURNING * 
         `;
         const values = [title, description,isbn , image_url,nevar];
         client.query(SQL, values).then(()=> {
           response.redirect('/');
       });
      });
      
       }
    })
}


function updateOneBook(request, response) {
  const id = request.params.id;
  // console.log(id);
  const {title, description, isbn, author} = request.body;

//  let sql5=`UPDATE author a INNER JOIN books b ON a.SelectedName= b.Name 
//    SET a.name= b.Id`
//    SELECT NameId, SelectedName 
// FROM table_1 
// WHERE SelectedName IN (SELECT Name FROM table_2);
// UPDATE books SET author_id=author.id FROM (SELECT * FROM author) AS author WHERE books.author = author.name;

  let SQL = `UPDATE books 
      SET 
          title=$1, description=$2, isbn=$3, author=$4
      WHERE 
          id=$5`
  
  let values = [title, description, isbn, author, id];
  client.query(SQL, values).then(results=> {
    // console.log(SQL);
      response.redirect(`/books/${id}`);
  }).catch(e=> {
    console.log('erorrrrrrrrrrrrrrrrrrrrrr in edit')
});
}

function deleteOneBook(request, response){
  const id = request.params.id;
  let SQL = `DELETE FROM books 
  WHERE 
      id=$1`
     let values = [id];
      client.query(SQL, values).then(results=> {
        // console.log(SQL);
          response.redirect('/');
      });
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
    
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
     })
    .then(results => response.render('pages/show', { searchResults: results })).catch((err)=> {
        console.log("ERROR IN SERVER DOSENS't WORK");
        console.log(err)
      });
  // how will we handle errors?
}