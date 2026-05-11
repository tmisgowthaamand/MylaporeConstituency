const fs = require('fs');
const filePath = 'c:/Users/Admin/OneDrive/Pictures/project/grievance-portal/src/pages/GrievanceHome.jsx';
let content = fs.readFileSync(filePath, 'utf8');
const renderStartIdx = content.indexOf('  return (\n');
const newRender = fs.readFileSync('c:/Users/Admin/OneDrive/Pictures/project/grievance-portal/newRender.txt', 'utf8');
fs.writeFileSync(filePath, content.substring(0, renderStartIdx) + newRender + '\n}\n', 'utf8');
