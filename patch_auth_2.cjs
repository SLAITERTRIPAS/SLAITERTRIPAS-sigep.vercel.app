const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.ts', 'utf8');

const regex = /export const getAuthorizedActivities = \(activities: any\[\], user: any\) => \{[\s\S]*?if \(isSuperBossUser\(user\)\) return activities;/;

const replacement = `export const getAuthorizedActivities = (activities: any[], user: any) => {
  if (!activities) return [];
  if (!user) return activities;

  if (isSuperBossUser(user)) return activities;

  const roles = getRoles(user.title || user.cargo || user.cargoChefia || user.role || "");
  // O Diretor de Curso (DCC), Diretores Centrais, Chefes e Gestores não possuem atividades ocultas.
  if (roles.isDCC || roles.isDG || roles.isDC || roles.isCD || roles.isBoss || user.isDCC || user.isBoss) {
    return activities;
  }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/lib/auth.ts', content);
  console.log("Patched auth.ts successfully via regex!");
} else {
  console.log("Regex did not match auth.ts");
}
