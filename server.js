// const express = require("express");
// const app = express();
// const router = express.Router();
// const path = require("path");
// const { engine } = require("express-handlebars");

// app.use(express.static(path.join(__dirname, "public")));
// const port = 8000;

// app.engine("hbs", engine({ 
//     extname: ".hbs", 
//     defaultLayout: "main", 
//     layoutsDir: path.join(__dirname, "views", "layouts")
// }));
// app.set("view engine", "hbs");
// app.set("views", path.join(__dirname, "views"));

// router.get("/", (req, res) => {
//     const cousers = [];
//     res.status(200).render("index", {
//         docTile: "hi",
//         cousers,
//         path: "main",
//         isIndex: false,
//         // layout: "main"
//     });
// });
// router.get("/index", (req, res) => {
//   res.status(200).render("main", {
//       docTile: "Index Page",
//       path: "index",
//       isIndex: true,
//       layout: "main"
//   });
// });

// app.use(router);
// app.listen(port, () => console.log(`App listening on port ${port}`));


///
const express = require("express");
const app = express();
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { engine } = require("express-handlebars");

app.use(express.static(path.join(__dirname, "public")));
const port = 8000;

app.engine("hbs", engine({ 
    extname: ".hbs", 
    defaultLayout: false,  // Default layout file
    layoutsDir: path.join(__dirname, "views", "layouts")
}));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// app.post("/add-user", async (req, res) => {
//   try {
//       const { name, email, start_date, end_date } = req.body;

//       // Validation
//       if (!name || !email || !start_date || !end_date) {
//           return res.status(400).json({ message: "All fields are required" });
//       }

//       // Create a new user
//       const newUser = new UserStudent({
//           name,
//           email,
//           start_date,
//           end_date,
//       });

//       // Save user to database
//       await newUser.save();
//       res.status(201).json({ message: "User added successfully", user: newUser });
//   } catch (error) {
//       console.error("Error adding user:", error);
//       res.status(500).json({ message: "Internal Server Error" });
//   }
// });
// Main Page Route
router.get("/", async(req, res) => {
    const cousers = [];
    res.status(200).render("index", {
        docTile: "Main Page",
        cousers,
        path: "index",
    });
});

// router.get("/main", (req, res) => {
//   res.status(200).render("main", {
//       docTile: "Main Page",
//       isIndex: true,
//   });
// });

// Nodemailer transporter setup


const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  auth: {
      user: process.env.SENDMAIL, 
      pass: process.env.APP_PASSWORD 
  }
});
const cousers = [{
  name:"kishore",
  startdate:"09-12-2025",
  enddate:"10-04-2026",
  duration:"6-months"
}];
app.get('/generate-pdf',async(req,res)=>{
    try{
        res.render('main',async(err,html)=>{
            if(err){
                return res.status(500).send('Error rendering template');
            }
            cousers;
           

        //launch puppeteer
            const browser =await puppeteer.launch();
            const page =await browser.newPage();

            //set page content
            await page.setContent(html,{waitUntil:'load'});

            //pdf path
            const pdfPath =path.join(__dirname,'certificate.pdf');


            //Generating PDF
            await page.pdf({path:pdfPath,format:'A4'});

            await browser.close();

            const pdfBuffer = fs.readFileSync(pdfPath);

            const mailOptions = {
                from: {
                    name: 'AventsTech',
                    address: process.env.SENDMAIL
                },
                to: ['4022karthickm@gmail.com','ravichandrannethaji@gmail.com'], // Change to your recipient email
                subject: 'Cource Completion Certificate',
                text: 'Please find the attached Certificate.',
                attachments: [
                    {
                        filename: 'APJCourceCertificate.pdf',
                        content: pdfBuffer
                    }
                ]
            };
            res.download(pdfPath,'APJCourceCertificate.pdf',(err)=>{
                if(err){
                    console.log(err);
                    
                }
                //fs.unlinkSync(pdfPath)
            });

           
            transporter.sendMail(mailOptions, (err, info) => {
                // Delete the PDF file after sending
                //fs.unlinkSync(pdfPath);

                if (err) {
                    console.error('Error sending email:', err);
                     res.status(500).json({ status: 0, message: 'Error sending email', error: err.message });
                }
                
                console.log('Email sent:', info);
                res.status(200).json({ status: 1, message: "Email sent successfully" });
            });
        
        })
    }catch(error){
        console.error('Error generating PDF:', error);
        res.status(500).send('Failed to generate PDF');
    }
})

app.use(router);
app.listen(port, () => console.log(`App listening on port ${port}`));
////

