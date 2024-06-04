import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import bcrypt from 'bcrypt';
import cors from 'cors';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from 'express-session'
import path from 'path';
import { fileURLToPath } from 'url';
import multer from "multer"


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const dbURL = process.env.MONGOURL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname));

app.use(session({
    secret:'mysecret',
    resave:false,
    saveUninitialized:true,
    cookeis:{secure:false}
}))

app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(dbURL, {

});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  googleId: { type: String }
});

const User = mongoose.model('User', userSchema);

// Signup Endpoint
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    req.session.isLoggedIn = true;
    res.status(200).json({ message: 'Signup Successful' });
  } catch (err) {
    console.error('Error Saving user', err);
    res.status(500).json({ message: 'Error Saving User' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid username or password' });
    } else {
      // Set flag in localStorage indicating user is logged in
      req.session.isLoggedIn = true;
      res.status(200).json({ message: 'Login successful' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next(); // User is logged in, proceed to the next middleware
  } else {
    res.redirect('/login.html'); // Redirect to login page if not logged in
  }
};



// Logout Endpoint
app.post('/logout', (req, res) => {
  // Clear flag in localStorage indicating user is logged out
  localStorage.removeItem('isLoggedIn');
  res.redirect('/login.html'); // Redirect to login page after logout
});

// Forgot password Endpoint
app.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Please provide a valid email address" });
    }
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return res.status(400).send({ message: "User not found. Please register." });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });
    const receiver = {
      from: "inugamer222@gmail.com",
      to: email,
      subject: "Password Reset Request",
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
             Please click on the following link, or paste this into your browser to complete the process:\n\n
             http://localhost:3000/reset-password/${token}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };
    await transporter.sendMail(receiver);
    return res.status(200).send({ message: "Password reset link has been sent successfully to your registered email address" });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password Endpoint
app.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(500).send({ message: "Please Provide a password" });
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findOne({ email: decode.email });
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).send({ message: "Password Reset Successfully" });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Sign In using Google

app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );
  
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login.html",
    }),
    (req, res) => {
      res.redirect("/home.html");
    }
  );
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true
},
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((user, done) => {
    done(null, user);
  });


// Item Schema
const itemSchema = new mongoose.Schema({
    fullname:{type:String , required:true},
    itemType: { type: String, required: true },
    condition: { type: String, required: true },
    quantity: { type: Number, required: true },
    imagePath: { type: String, required: true },
    account:{type:String},
    upi:{type:String, required:false},
    description:{type:String,required:true},
    location:{type:String , required:true},
    email:{type:String,required:true},

  },{
    timestamps:true
  });
  
  const Item = mongoose.model('Item', itemSchema);
  
  // Multer Configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads"); // specify your upload folder
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); // define file name
    },
  });
  
  const upload = multer({ storage: storage });
  
  // Upload Route
  app.post("/upload", upload.single("image"), async (req, res) => {
    try {
      const { itemType, condition, quantity , account, upi  ,fullname,location, description ,email} = req.body;
      const imagePath = req.file.path; // Path to the uploaded image
      const newItem = new Item({ fullname, itemType, condition, quantity, imagePath , account,upi,location, description ,email});
      await newItem.save();
      res.status(200).json({ message: "Upload successful" });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


// Fetch posted ads route
app.get("/ads", async (req, res) => {
    try {
      const ads = await Item.find();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Define Schema for Recycling Centers
// const recyclingCenterSchema = new mongoose.Schema({
//     name: { type: String, unique: true },
//     address: String,
//     location: {
//       type: {
//         type: String,
//         enum: ["Point"],
//         required: true
//       },
//       coordinates: {
//         type: [Number],
//         required: true
//       }
//     }
// });
//  // Create model for Recycling Centers
// const RecyclingCenter = mongoose.model("RecyclingCenter", recyclingCenterSchema);


// // Define an array of recycling centers
// const recyclingCenters = [
//     {
//       name: "Eco Recycling Ltd",
//       address: "3rd Cross Road, Attibele Industrial Area, Attibele, Bengaluru, Karnataka 562107",
//       location: {
//         type: "Point",
//         coordinates: [12.7845, 77.7614] // Latitude and longitude
//       }
//     },
//     {
//       name: "Saahas Zero Waste",
//       address: "No. 7, NGV Mansion, 1st Cross Rd, KHB Colony, Koramangala 5th Block, Bengaluru, Karnataka 560095",
//       location: {
//         type: "Point",
//         coordinates: [12.9341, 77.6221] // Latitude and longitude
//       }
//     },
//     {
//         name: "Recyclean Solutions",
//         address: "9/4, 7th Main Rd, Jayanagar East, Jaya Nagar 1st Block, Jaya Nagar East, Bengaluru, Karnataka 560011",
//         location: {
//             type: "Point",
//             coordinates: [12.9302, 77.5836] // Latitude and longitude
//         }
//     },
//     {
//         name: "The Society For Automotive Fitness & Environment",
//         address: "20/2, Rupena Agrahara, Begur Hobli, Hosur Road, Begur, Bengaluru, Karnataka 560068",
//         location: {
//             type: "Point",
//             coordinates: [12.8825, 77.6203] // Latitude and longitude
//         }
//     },
//     {
//         name: "Globetrek Engineering Corporation",
//         address: "28/1, Opp. KSSIDC, Doddakalsandra, Kanakapura Road, Bengaluru, Karnataka 560062",
//         location: {
//             type: "Point",
//             coordinates: [12.8698, 77.5488] // Latitude and longitude
//         }
//     },
//     {
//         name: "Clean City Recyclers Pvt. Ltd.",
//         address: "43, 1st Main Road, BTM Layout 1st Stage, Bengaluru, Karnataka 560029",
//         location: {
//             type: "Point",
//             coordinates: [12.9166, 77.6101] // Latitude and longitude
//         }
//     },
//     {
//         name: "Green Sense",
//         address: "32/3, 1st Cross Rd, Adugodi, Bengaluru, Karnataka 560030",
//         location: {
//             type: "Point",
//             coordinates: [12.9443, 77.6141] // Latitude and longitude
//         }
//     },
//     {
//         name: "Karnataka Composting Development Corporation",
//         address: "10th Main Rd, Jeevan Bhima Nagar, Bengaluru, Karnataka 560075",
//         location: {
//             type: "Point",
//             coordinates: [12.9705, 77.6608] // Latitude and longitude
//         }
//     },
//     {
//         name: "SWaCH Waste Management",
//         address: "No 92, 5th Main Road, Chamarajpet, Bengaluru, Karnataka 560018",
//         location: {
//             type: "Point",
//             coordinates: [12.9539, 77.5715] // Latitude and longitude
//         }
//     },
//     {
//         name: "E-Parisaraa Pvt Ltd",
//         address: "51, 7th A Cross, Lakshmipuram, Near Shamanna Park, Ulsoor, Bengaluru, Karnataka 560008",
//         location: {
//             type: "Point",
//             coordinates: [12.9808, 77.6252] // Latitude and longitude
//         }
//     },
//     {
//         name: "E-Waste Recycling Solutions",
//         address: "No. 3, No. 79, Ambedkar Colony, Main Rd, Basaveshwara Nagar, Bengaluru, Karnataka 560079",
//         location: {
//             type: "Point",
//             coordinates: [13.0043, 77.5383] // Latitude and longitude
//         }
//     },
//     {
//         name: "Daily Dump",
//         address: "1, Rathnamma Garden, Naidu Layout, Ramaiah Reddy Layout, Kammanahalli, Bengaluru, Karnataka 560084",
//         location: {
//             type: "Point",
//             coordinates: [13.0095, 77.6386] // Latitude and longitude
//         }
//     },
//     {
//         name: "Kasa Rasa",
//         address: "142/1, Next to Mahila Sahakari Bank, 16th Cross Rd, Malleshwaram West, Bengaluru, Karnataka 560003",
//         location: {
//             type: "Point",
//             coordinates: [13.0063, 77.5617] // Latitude and longitude
//         }
//     },
//     {
//         name: "Sustainable Waste Management Pvt. Ltd.",
//         address: "24, Siddanna Building, Puttappa Industrial Estate, Peenya Industrial Area, Bengaluru, Karnataka 560058",
//         location: {
//             type: "Point",
//             coordinates: [13.0208, 77.5283] // Latitude and longitude
//         }
//     },
//     {
//         name: "Eco-Wise Waste Management Pvt Ltd",
//         address: "No. 18, 8th Cross Rd, KHB Colony, Koramangala 5th Block, Koramangala, Bengaluru, Karnataka 560034",
//         location: {
//             type: "Point",
//             coordinates: [12.9338, 77.6241] // Latitude and longitude
//         }
//     },
//     {
//         name: "Vista Eco Solutions Pvt Ltd",
//         address: "82, Ground Floor, 1st Main Road, Sudhamanagar, Bengaluru, Karnataka 560027",
//         location: {
//             type: "Point",
//             coordinates: [12.9656, 77.5923] // Latitude and longitude
//         }
//     },
//     {
//         name: "Ragpickers",
//         address: "2nd Floor, No. 3, 3rd Cross Rd, D' Souza Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
//         location: {
//             type: "Point",
//             coordinates: [12.9762, 77.5955] // Latitude and longitude
//         }
//     },
//     {
//         name: "Solid Waste Management Round Table",
//         address: "SWMRT Office, Bengaluru, Karnataka 560001",
//         location: {
//             type: "Point",
//             coordinates: [12.9716, 77.5946] // Latitude and longitude
//         }
//     },
//     {
//         name: "Green Mountain Recycling",
//         address: "1, 6th Cross Rd, Kalasipalya, Bengaluru, Karnataka 560002",
//         location: {
//             type: "Point",
//             coordinates: [12.9659, 77.5821] // Latitude and longitude
//         }
//     },
//   ];
  
// // Loop through the array of recycling centers and add them to the database
// recyclingCenters.forEach(async center => {
//     try {
//         await RecyclingCenter.findOneAndUpdate({ name: center.name }, center, { upsert: true });
//     } catch (error) {
//         console.error("Error adding recycling center:", error);
//     }
// });

// // Pincode Search Endpoint
// const pincodeSchema = new mongoose.Schema({
//     pincode: { type: String, unique: true },
//     latitude: Number,
//     longitude: Number
// });
// const Pincode = mongoose.model('Pincode', pincodeSchema);


// // Pincode Search Endpoint
// app.post('/pincode-search', async (req, res) => {
//     try {
//         const { pincode } = req.body;
//         // Query the database to retrieve coordinates for the provided pincode
//         const pincodeData = await Pincode.findOne({ pincode });
//         if (!pincodeData) {
//             throw new Error('No location found for the provided pincode');
//         }
//         // Query the database for recycling centers near the obtained coordinates
//         const nearbyRecyclingCenters = await RecyclingCenter.find({
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: 'Point',
//                         coordinates: [pincodeData.longitude, pincodeData.latitude] // Use the coordinates from the pincode database
//                     },
//                     $maxDistance: 10000 // 10 km radius
//                 }
//             }
//         });
//         res.status(200).json(nearbyRecyclingCenters);
//     } catch (error) {
//         console.error('Error performing pincode search:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });




