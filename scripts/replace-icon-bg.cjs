const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('/Volumes/Yatri Cloud/org/Yatri Cloud/yatri-practice-hub/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace bg-primary/10 or bg-primary/20 combined with text-primary
    content = content.replace(/bg-primary\/[1-2]0\s+text-primary/g, 'bg-primary text-white');
    content = content.replace(/text-primary\s+bg-primary\/[1-2]0/g, 'bg-primary text-white');
    
    // Replace bg-success/10 combined with text-success
    content = content.replace(/bg-success\/[1-2]0\s+text-success/g, 'bg-success text-white');
    content = content.replace(/text-success\s+bg-success\/[1-2]0/g, 'bg-success text-white');

    // Replace any remaining bg-primary/10 with bg-primary text-white
    // But we need to make sure we also remove text-primary if it exists elsewhere in the same string.
    // A simpler approach:
    const regex = /className="([^"]*bg-(?:primary|success|green-500|emerald-500)\/[1-2]0[^"]*flex[^"]*items-center[^"]*justify-center[^"]*)"/g;
    
    content = content.replace(regex, (match, classList) => {
        let newClassList = classList;
        
        // Remove the /10 or /20 from the background color
        newClassList = newClassList.replace(/bg-(primary|success|green-500|emerald-500)\/[1-2]0/g, 'bg-$1');
        
        // Remove text-primary, text-success, text-green-500, text-emerald-600
        newClassList = newClassList.replace(/\btext-(primary|success|green-500|emerald-[0-9]+)\b/g, '');
        
        // Add text-white
        if (!newClassList.includes('text-white')) {
            newClassList += ' text-white';
        }
        
        // Clean up multiple spaces
        newClassList = newClassList.replace(/\s+/g, ' ').trim();
        
        return `className="${newClassList}"`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
