const express = require('express');
const app = express();
const puppeteer=require("puppeteer");
const fs=require("fs");
const path = require("path");
const nodemailer=require("nodemailer");
const { engine } = require('express-handlebars');
app.use(express.static('public'));
require('dotenv').config();

app.engine("hbs",engine({extname:".hbs",defaultLayout:false}))
app.set("view engine",'hbs')
 app.set("views","./views")
app.use(express.static((__dirname,"public/css")))
 const port=8000;
let student={

}
app.get('/',(req,res)=>{
  res.render('main',student); 
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  auth: {
      user: process.env.SENDMAIL, 
      pass: process.env.APP_PASSWORD
  }
});
app.get("/generate-pdf",async (req,res)=>{
  try{
    const logoPath = "file://" + path.join(__dirname, "public/images/apj-logo.png");
    const cetificateTemplatePath = "file://" + path.join(__dirname, "public/images/cetificatetemplate.png");
    const signaturePath = "file://" + path.join(__dirname, "public/images/founder_signature.png");
    student.logoPath = logoPath;
    student.cetificateTemplatePath=cetificateTemplatePath;
    student.signaturePath = signaturePath;
    res.render("index",student,async(err,html)=>{
      if(err){
         res.status(500).send('Error rendering template');
      }
      const browers=await puppeteer.launch();
      const page= await browers.newPage();

      await page.setContent(html,{waitUntil:"load"})

      const pdfPath=path.join(__dirname,"APJcoursecertificate.pdf");
      await page.pdf({path:pdfPath,format:"A4"});
      await browers.close();
      const pdfBuffer=fs.readFileSync(pdfPath);

      const mailOptions = {
        from: {
            name: 'AventsTech',
             address:process.env.SENDMAIL
        },
        to: ['kishoreifet@gmail.com'],
        subject: 'Cource Completion Certificate',
        text: 'Please find the attached Certificate.',
        attachments: [
            {
                filename: 'APJcoursecertificate.pdf',
                content: pdfBuffer
            }
        ]
    };
    res.download(pdfPath,'APJcoursecertificate.pdf',(err)=>{
      if(err){
          console.log(err);     
      }
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

} catch(error){
  console.error('Error generating PDF:', error);
  res.status(500).send('Failed to generate PDF');
}
})

// Start server
app.listen(port, () => console.log(`App listening on port ${port}`));

