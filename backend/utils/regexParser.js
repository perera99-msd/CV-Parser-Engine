function parseRawText(text) {
  // 1. AGGRESSIVE CLEANING
  let cleanText = text.replace(/---\s*PAGE\s*\d+\s*---/gi, '');
  cleanText = cleanText.replace(/\[Image \d+\]/gi, ''); // Remove image artifacts
  cleanText = cleanText.replace(/[📍✉️📱]/g, ''); // Strip emojis
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const profile = {
    name: 'Unknown Applicant', email: '', phone: '', location: '', summary: '',
    skills: [], experience: [], projects: [], education: [], certifications: [], rawText: text
  };

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\+?\d{1,4}?[\s-]?\(?\d{1,3}?\)?[\s-]?\d{3,4}[\s-]?\d{4,}/;

  if (lines.length > 0) profile.name = lines[0];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (!profile.email && emailRegex.test(lines[i])) profile.email = lines[i].match(emailRegex)[0];
    if (!profile.phone && phoneRegex.test(lines[i])) profile.phone = lines[i].match(phoneRegex)[0];
  }

  // 2. EXPANDED BUCKET SORTING
  const sections = { summary: [], skills: [], experience: [], projects: [], education: [], certifications: [] };
  let currentSection = 'summary';

  // We expanded the Lexicon to handle Oshani's and Dineth's section titles
  const sectionKeywords = {
    summary: ['professional summary', 'profile', 'overview'],
    skills: ['technical skills', 'skills', 'core competencies'],
    projects: ['key projects', 'projects', 'personal projects', 'project experience'],
    experience: ['experience', 'employment', 'work history', 'professional experience'],
    education: ['education', 'academic background'],
    certifications: ['licenses & certs', 'certifications', 'licenses', 'additional strengths'] // Mapped Oshani's extra section
  };

  for (let line of lines) {
    const lowerLine = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    let foundNewSection = null;

    // Exact or close match for section headers
    for (const [key, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.includes(lowerLine) || (lowerLine.length < 30 && keywords.some(k => lowerLine === k))) {
        foundNewSection = key;
        break;
      }
    }

    if (foundNewSection) {
      currentSection = foundNewSection;
    } else {
      // Prevent bleeding of core metadata into the summary
      if (currentSection === 'summary' && (line.includes(profile.email) || phoneRegex.test(line))) continue;
      sections[currentSection].push(line);
    }
  }

  // 3. TOLERANT ASSEMBLY STATE MACHINES

  // --- Summary ---
  profile.summary = sections.summary.filter(line => line.length > 20).join(' ').replace(/\|\s*/g, '').trim();

  // --- Skills (Handles Sanchana's lists & Dineth's colon structures) ---
  profile.skills = sections.skills
    .flatMap(line => line.replace(/^[a-zA-Z\s&]+:\s/, '').split(/[,|•●]/))
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40);

  // --- Projects (Handles "Technologies:" & URLs) ---
  let projBlock = null;
  for (let i = 0; i < sections.projects.length; i++) {
    let line = sections.projects[i];
    // Handles Oshani's "Technologies:" and Sanchana's "Stack:"
    const isStack = /^(Tech )?Stack:|Technologies:/i.test(line); 
    const isLink = /https?:\/\//i.test(line);
    const isBullet = line.startsWith('•') || line.startsWith('●') || line.startsWith('-');

    if (!isBullet && !isStack && !isLink && line.length < 100) {
      if (projBlock) profile.projects.push(projBlock);
      projBlock = { 
        name: line.replace(/Link|GitHub|Live Site/ig, '').replace(/[-|]/g, '').trim(), 
        techStack: '', link: '', details: [] 
      };
    } else if (isStack && projBlock) {
      projBlock.techStack = line.replace(/^(Tech )?Stack:\s*|Technologies:\s*/i, '').trim();
    } else if (isLink && projBlock) {
      projBlock.link = line;
    } else if (projBlock) {
      let cleanDetail = line.replace(/^[-•●]\s*/, '').trim();
      if (isBullet || projBlock.details.length === 0) {
        projBlock.details.push(cleanDetail);
      } else {
        projBlock.details[projBlock.details.length - 1] += ' ' + cleanDetail;
      }
    }
  }
  if (projBlock) profile.projects.push(projBlock);

  // --- Experience (Highly Tolerant) ---
  let expBlock = null;
  for (let i = 0; i < sections.experience.length; i++) {
    let line = sections.experience[i];
    
    const isDate = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2})\s*(?:-|–|to)\s*(?:Present|20\d{2})/i.test(line);
    const isBullet = line.startsWith('•') || line.startsWith('●') || line.startsWith('-');
    
    // If it's short, doesn't have a bullet, and isn't a date, it's likely a Role/Company header
    if (!isBullet && !isDate && line.length < 70) {
      if (!expBlock || expBlock.duration || expBlock.details.length > 0) {
        if (expBlock) profile.experience.push(expBlock);
        expBlock = { role: line, company: '', duration: '', details: [] };
      } else if (!expBlock.company) {
        expBlock.company = line;
      }
    } else if (isDate && expBlock) {
      expBlock.duration = line;
    } else if (isBullet && expBlock) {
      expBlock.details.push(line.replace(/^[-•●]\s*/, '').trim());
    } else if (expBlock && expBlock.details.length > 0) {
      expBlock.details[expBlock.details.length - 1] += ' ' + line.trim();
    }
  }
  if (expBlock) profile.experience.push(expBlock);

  // --- Education ---
  let eduBlock = null;
  for (let i = 0; i < sections.education.length; i++) {
    let line = sections.education[i];
    const isDegree = /(BSc|BA|Master|Diploma|Certificate|G\.C\.E|Level|Degree)/i.test(line);

    if (isDegree) {
      if (eduBlock) profile.education.push(eduBlock);
      eduBlock = { degree: line, institution: '', year: '' };
    } else if (eduBlock && !line.startsWith('●') && !line.startsWith('•')) {
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch) eduBlock.year = yearMatch[0];
      
      let instName = line.replace(/(19|20)\d{2}/, '').replace(/Expected:|March/gi, '').trim();
      if (instName.length > 0) {
        eduBlock.institution += (eduBlock.institution ? ', ' : '') + instName;
      }
    }
  }
  if (eduBlock) profile.education.push(eduBlock);

  return profile;
}

module.exports = { parseRawText };