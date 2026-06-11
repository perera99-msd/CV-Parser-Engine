const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
  role: String,
  company: String,
  duration: String,
  details: [String]
});

const ProjectSchema = new mongoose.Schema({
  name: String,
  techStack: String,
  details: [String],
  link: String
});

const EducationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  year: String
});

const CertSchema = new mongoose.Schema({
  name: String,
  issuer: String,
  year: String
});

const ResumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  location: String,
  summary: String,
  skills: [String],
  experience: [ExperienceSchema],
  projects: [ProjectSchema],
  education: [EducationSchema],
  certifications: [CertSchema],
  volunteering: [String],
  rawText: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);