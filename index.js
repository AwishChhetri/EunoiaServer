const express = require('express');
const mongoose = require('mongoose');
const paymentRoutes = require('./Routes/payment.js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://abish:l2TFchymzqLLYAOY@cluster0.btfwxae.mongodb.net/?retryWrites=true&w=majority');

// Create a User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
  age: Number,
  maritalStatus: String,
  gender: String,
});

// Create a User model
const User = mongoose.model('User', userSchema);

// Signup route with JWT token
app.post('/signup', async (req, res) => {
  try {
    const { email, phoneNumber, age, maritalStatus, gender, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash the password before saving it to the database

    // Create a new user
    const newUser = new User({ email, password, phoneNumber, age, maritalStatus, gender });

    // Save the user to the database
    await newUser.save();

    // Generate JWT token with email and user ID
    const token = jwt.sign(
      { userId: newUser._id, email, phoneNumber, age, maritalStatus, gender },
      'your_secret_key',
      { expiresIn: '1h' }
    );

    // Respond with the token
    res.status(201).json({ token });
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user with the provided email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password in the database

    // Generate JWT token with email and user ID
    const token = jwt.sign({ userId: user._id, email }, 'your_secret_key', {
      expiresIn: '1h',
    });

    // Respond with the token
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/api/payment/orders', async (req, res) => {
  console.log("order")
  try {
    const instance = new Razorpay({
      key_id: 'rzp_test_QwVFufHZbexRin',
      key_secret: 'mkq6sWa8gQfjlExYYrIJgXB1',
    });

    const options = {
      amount: req.body.amount * 100,
      currency: 'INR',
      receipt: crypto.randomBytes(10).toString('hex'),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Something Went Wrong' });
      }
      console.log(order)
      res.status(200).json({ data: order });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get("/api/payment/orders",(req,res)=>{
  res.send("Hey")
})
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac('sha256', 'mkq6sWa8gQfjlExYYrIJgXB1')
      .update(sign.toString())
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    } else {
      return res.status(200).json({ message: 'Payment verified successfully' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
