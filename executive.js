/**
 * Create the url for a given reference
 */
function uscUrl(reference) {
  var substructureLocation = '';
  if (reference.subsections.length > 0) {
    substructureLocation = '#substructure-location_' + reference.subsections.join('_');
  }
  return 'http://uscode.house.gov/view.xhtml?req=(title:' + reference.title + '%20section:' + reference.section + '%20edition:prelim)&f=treesort&edition=prelim&num=0&jumpTo=true' + substructureLocation;
}

var uscRegex = '(?:U\\.?|United) ?(?:S\\.?|States) ?(?:C\\.?|Code)';
var subsectionsRegex = '(?:\\([a-zA-Z0-9]+\\))';
// 13, 12(a)(g) or (b)
var sectionRegex = '(\\d+' + subsectionsRegex + '*|' + subsectionsRegex + '+)';
// section 13(g) of title 12 USC
var sectionsRegex = 'sections? (' + sectionRegex + '(?:, (?:and )?' + sectionRegex + ')*) of title (\\d+),? ' + uscRegex;
// 12 USC 13(g)
var compactSectionsRegex = '(\\d+) ' + uscRegex + ' ' + sectionRegex + '(?:, (?:and )?' + sectionRegex + ')*';

function parseSection(context, str) {
  var sectionParts = str.split(/[()]+/g);
  if (str[0] !== '(') {
    context.section = parseInt(sectionParts.shift());
  }

  var subsections = sectionParts.filter(function(s) {
    return s.length > 0;
  });

  return {
    section: context.section,
    subsections: subsections,
    title: context.title
  };
}

function makeSectionLink(text, section) {
  return '<a target="_blank" href="' + uscUrl(section) + '">' + text + '</a>';
}

function processSections(str, sectionsRegex, getSections, getTitle) {
  var output = '';
  var context = {
    title: 0,
    section: 0
  };
  var re = new RegExp(sectionsRegex, 'g');
  var secRe = new RegExp(sectionRegex, 'g');

  var lastStart = 0;
  while (true) {
    var matches = re.exec(str);
    if (!matches) {
      break;
    }
    output += str.substring(lastStart, matches.index);
    lastStart = re.lastIndex;
    var sectionsStr = getSections(matches);
    var sectionsOutput = matches[0];
    context.title = parseInt(getTitle(matches));
    while (true) {
      var sectionMatches = secRe.exec(sectionsStr);
      if (!sectionMatches) {
        break;
      }
      var sectionStr = sectionMatches[0];
      var section = parseSection(context, sectionStr);
      sectionsOutput = sectionsOutput.replace(sectionStr, makeSectionLink(sectionStr, section));
    }
    output += sectionsOutput;
  }
  output += str.substring(lastStart);

  return output;
}

function transformElement(element) {
  console.log(element);
  element.innerHTML = processSections(element.innerHTML, sectionsRegex, function(matches) {
    return matches[1];
  }, function(matches) {
    return parseInt(matches[matches.length - 1])
  });
  element.innerHTML = processSections(element.innerHTML, compactSectionsRegex, function(matches) {
    return matches[2];
  }, function(matches) {
    return parseInt(matches[1])
  });
}

document.querySelectorAll('p').forEach(function(p) {
  transformElement(p);
});
