"use strict";
// Kapi: a capivara que acompanha os estudos (com um mikan na cabeça, como nas termas do Japão).
// mood: happy | cheer | sad | think | wave | wow | sleep
function kapi(mood, cls) {
  mood = mood || "happy";
  const eyes = {
    happy: '<circle cx="39" cy="47" r="3.4"/><circle cx="81" cy="47" r="3.4"/><circle cx="40.1" cy="45.9" r="1.1" fill="#fff"/><circle cx="82.1" cy="45.9" r="1.1" fill="#fff"/>',
    cheer: '<path d="M34 49q5-7 10 0M76 49q5-7 10 0" fill="none" stroke="#3b2a1c" stroke-width="3" stroke-linecap="round"/>',
    sad: '<circle cx="39" cy="49" r="3.2"/><circle cx="81" cy="49" r="3.2"/><path d="M33 42l9 3M87 42l-9 3" fill="none" stroke="#3b2a1c" stroke-width="2.4" stroke-linecap="round"/><path d="M88 53q3 5 0 8q-3-3 0-8z" fill="#7cc4f5"/>',
    think: '<circle cx="40" cy="48" r="3.2"/><circle cx="82" cy="48" r="3.2"/><path d="M76 41l10-3" fill="none" stroke="#3b2a1c" stroke-width="2.4" stroke-linecap="round"/>',
    wow: '<circle cx="39" cy="47" r="4.4"/><circle cx="81" cy="47" r="4.4"/><circle cx="40.5" cy="45.5" r="1.6" fill="#fff"/><circle cx="82.5" cy="45.5" r="1.6" fill="#fff"/>',
    sleep: '<path d="M34 48q5 4 10 0M76 48q5 4 10 0" fill="none" stroke="#3b2a1c" stroke-width="3" stroke-linecap="round"/>',
  };
  eyes.wave = eyes.happy;
  const mouth = {
    happy: '<path d="M53 72q7 6 14 0" fill="none" stroke="#3b2a1c" stroke-width="2.4" stroke-linecap="round"/>',
    cheer: '<path d="M52 71q8 10 16 0z" fill="#8a3b34" stroke="#3b2a1c" stroke-width="2" stroke-linejoin="round"/>',
    sad: '<path d="M54 76q6-5 12 0" fill="none" stroke="#3b2a1c" stroke-width="2.4" stroke-linecap="round"/>',
    think: '<path d="M55 74h10" fill="none" stroke="#3b2a1c" stroke-width="2.4" stroke-linecap="round"/>',
    wow: '<ellipse cx="60" cy="75" rx="4" ry="4.6" fill="#8a3b34" stroke="#3b2a1c" stroke-width="2"/>',
    sleep: '<path d="M55 73q5 3 10 0" fill="none" stroke="#3b2a1c" stroke-width="2.4" stroke-linecap="round"/>',
  };
  mouth.wave = mouth.cheer;
  const arms = {
    cheer: '<path d="M27 84q-12-8-13-22" /><path d="M93 84q12-8 13-22"/>',
    wave: '<path d="M27 88q-9 4-12 12"/><g class="wave"><path d="M92 82q12-6 14-20"/></g>',
    think: '<path d="M27 88q-9 4-12 12"/><path d="M90 92q4-10-12-14"/>',
  };
  const extra = {
    sleep: '<text x="92" y="32" font-size="15" font-weight="900" fill="#8a7f73" font-family="sans-serif">z</text><text x="103" y="20" font-size="11" font-weight="900" fill="#8a7f73" font-family="sans-serif">z</text>',
    think: '<circle cx="100" cy="30" r="3" fill="#d9cab6"/><circle cx="107" cy="20" r="4.5" fill="#d9cab6"/>',
    cheer: '<path d="M14 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM104 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd23f"/>',
  };
  return `<svg class="kapi ${cls || ""}" viewBox="0 0 120 124" aria-hidden="true"><g class="bounce">
<ellipse cx="60" cy="119" rx="34" ry="4" fill="rgba(0,0,0,.08)"/>
<ellipse cx="44" cy="113" rx="11" ry="6" fill="#7d5231"/><ellipse cx="76" cy="113" rx="11" ry="6" fill="#7d5231"/>
<path d="M24 96c0-22 14-32 36-32s36 10 36 32c0 14-12 20-36 20s-36-6-36-20z" fill="#b07a48"/>
<ellipse cx="60" cy="99" rx="19" ry="13" fill="#d7ab7c"/>
<g fill="none" stroke="#b07a48" stroke-width="9" stroke-linecap="round">${arms[mood] || '<path d="M27 88q-9 4-12 12"/><path d="M93 88q9 4 12 12"/>'}</g>
<ellipse cx="33" cy="29" rx="6.5" ry="6" fill="#8f5f36"/><ellipse cx="87" cy="29" rx="6.5" ry="6" fill="#8f5f36"/>
<ellipse cx="33" cy="30" rx="3" ry="2.8" fill="#6b4526"/><ellipse cx="87" cy="30" rx="3" ry="2.8" fill="#6b4526"/>
<rect x="21" y="25" width="78" height="62" rx="25" fill="#c48d57"/>
<rect x="33" y="55" width="54" height="30" rx="15" fill="#e2bb8e"/>
<ellipse cx="53.5" cy="62.500" rx="2.6" ry="3.4" fill="#4a3120"/><ellipse cx="66.500" cy="62.500" rx="2.6" ry="3.4" fill="#4a3120"/>
<ellipse cx="31" cy="60" rx="5" ry="3.2" fill="#f08f8f" opacity=".6"/><ellipse cx="89" cy="60" rx="5" ry="3.2" fill="#f08f8f" opacity=".6"/>
<g fill="#3b2a1c">${eyes[mood] || eyes.happy}</g>
${mouth[mood] || mouth.happy}
<circle cx="60" cy="18" r="10.5" fill="#ff9a1f"/><circle cx="56.500" cy="14.500" r="2.6" fill="#ffc46b"/>
<path d="M60 8q1-5 8-5q-1 6-8 5z" fill="#58b947"/>
${extra[mood] || ""}
</g></svg>`;
}
