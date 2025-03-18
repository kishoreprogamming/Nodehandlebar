const express = require("express");
const app = express();
const router = express.Router();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
require("dotenv").config();

const port = 8000;

//To get a data via req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//register a asset path to express
app.use(express.static(path.join(__dirname, "public")));

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: false, // Default layout file
    layoutsDir: path.join(__dirname, "views", "layouts"),
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

//Convert images to Base64 Format as its the formate supported by the puppettier pdf
const imagePath = path.join(__dirname, "public", "images", "apj-logo.png");
const imageBase64 = fs.readFileSync(imagePath, "base64");

const certTemplate = path.join(
  __dirname,
  "public",
  "images",
  "certificatetemplate.png"
);
const certTemplate_Base64 = fs.readFileSync(certTemplate, "base64");

const founderSign = path.join(
  __dirname,
  "public",
  "images",
  "founder_signature.png"
);
const founderSign_Base64 = fs.readFileSync(founderSign, "base64");

let cousers = {
  name: "kishore",
  startDate: "09-12-2025",
  endDate: "10-04-2026",
  duration: "6-months",
  imageBase64: `data:image/png;base64,${imageBase64}`,
  certTemplate_Base64: `data:image/png;base64,${certTemplate_Base64}`,
  founderSign_Base64: `data:image/png;base64,${founderSign_Base64}`,
};

router.get("/", async (req, res) => {
  console.log("inside get");
  console.log(cousers, "cousers in get");
  res.render("index", cousers);
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.SENDMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

app.get("/generate-pdf", async (req, res) => {
  try {
    // Render the HTML content
    res.render("main", cousers, async (err, html) => {
      if (err) {
        console.error("Error rendering template:", err);
        return res.status(500).send("Error rendering template");
      }

      // Launch puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Set page content
      await page.setContent(html, { waitUntil: "load" });

      await page.setContent(html, { waitUntil: "networkidle0" });

      // Define PDF path
      const pdfPath = path.join(__dirname, "certificate.pdf");

      // Generate PDF
      await page.pdf({
        path: pdfPath,
        printBackground: true,
        preferCSSPageSize: true, // Use CSS-defined page size
      });

      await browser.close();

      // Read the generated PDF
      const pdfBuffer = fs.readFileSync(pdfPath);

      // Send PDF file as response
      res.download(pdfPath, "APJCourceCertificate.pdf", (err) => {
        if (err) {
          console.log("Error downloading file:", err);
        }
      });

      //  Email configuration
      const mailOptions = {
        from: { name: "AventsTech", address: process.env.SENDMAIL },
        to: cousers.email,
        subject: "Course Completion Certificate",
        text: "Please find the attached Certificate.",
        attachments: [
          { filename: "APJCourceCertificate.pdf", content: pdfBuffer },
        ],
      };

      // Send email
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return res
            .status(500)
            .json({
              status: 0,
              message: "Error sending email",
              error: err.message,
            });
        }
        console.log("Email sent:", info);
        res.status(200).json({ status: 1, message: "Email sent successfully" });
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Failed to generate PDF");
  }
});

app.post("/poststudent", async (req, res) => {
  console.log("-----------inside post route----------");
  try {
    const { name, startDate, endDate, email } = req.body;
    let startDateObj = new Date(startDate);
    let endDateObj = new Date(endDate);
    console.log(typeof startDateObj);

    //Duration calculation starts
    let totalMonths =
      (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 +
      (endDateObj.getMonth() - startDateObj.getMonth());
    let totalDays = Math.floor(
      (endDateObj - startDateObj) / (1000 * 60 * 60 * 24)
    );

    if (endDateObj.getDate() < startDateObj.getDate()) {
      totalMonths--;
    }
    let output =
      totalMonths >= 1 ? `${totalMonths}-months` : `${totalDays}-days`;
    //Duration calculation ends

    cousers = { ...cousers, name, startDate, endDate, email, duration: output };
    

    return res
      .status(201)
      .json({ status: 201, message: "Student Details Saved", data: req.body });
  } catch (err) {
    console.log(err, "error from ");
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
});

app.use(router);
app.listen(port, () => console.log(`App listening on port ${port}`));
