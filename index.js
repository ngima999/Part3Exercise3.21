const express = require('express');
const morgan = require('morgan');
const app = express();
require('dotenv').config();
const cors = require('cors');
const Person = require('./models/person');



const PORT = process.env.PORT || 3001

app.use(cors());
app.use(express.json()); // Middleware for parsing JSON
app.use(express.static('dist'))
app.use(morgan("tiny"));


// Custom Morgan token to log request body for POST requests
morgan.token('body', (req) => {
  // Only log body for POST requests, otherwise return an empty string
  return req.method === 'POST' ? JSON.stringify(req.body) : '';
});

// Morgan middleware with custom token and tiny format
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body', {
  skip: (req) => req.method !== 'POST', // Only log the body for POST requests
}));


app.get("/api/persons", (request, result, next)=>{
  Person.find({}).then((persons)=>{
    result.json(persons)
  })
  .catch((error) => next(error));
})


// Fetch a specific contact by ID
app.get('/api/persons/:id', (req, res, next) => {
  const id = req.params.id;
  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).json({ error: 'Contact not found' });
      }
    })
    .catch((error) => next(error));
});



app.post('/api/persons', (request, result, next)=>{
  const body = request.body
  
  // if (body.name === undefined) {
  //   return response.status(400).json({ error: 'name missing' })
  // }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save().then(savedPerson => {
    result.json(savedPerson)
  }).catch((error) => next(error));
});
  

//Deleting 
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})


//Updating 
app.put('/api/persons/:id', (request, response, next) => {
  const {id} = request.params;
  const {number} = request.body

  Person.findByIdAndUpdate(id, {number}, { new: true, runValidators: true, context: 'query' })
    .then((updatedPerson) => {
      if(updatedPerson){
        response.json(updatedPerson);
      }else{
        response.status(404).end();
      }
    })
    .catch(error => next(error))
})



app.get('/info', (request, response, next) => {
  Person.find().then(personEntry => {
    response.send(`Phonebook has info of ${personEntry.length} people. ${Date()}`);
  }).catch(error => next(error));
})




const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler)



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
