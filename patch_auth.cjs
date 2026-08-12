const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.ts', 'utf8');

const targetStr = `export const getAuthorizedActivities = (activities: any[], user: any) => {
  if (!activities) return [];
  if (!user) return activities;
  if (isSuperBossUser(user)) return activities;`;

const replacementStr = `export const getAuthorizedActivities = (activities: any[], user: any) => {
  if (!activities) return [];
  if (!user) return activities;
  if (isSuperBossUser(user)) return activities;

  const roles = getRoles(user.title || user.cargo || user.cargoChefia || user.role || "");
  // O Diretor de Curso (DCC), Diretores Centrais, Chefes e Gestores não possuem atividades ocultas.
  if (roles.isDCC || roles.isDG || roles.isDC || roles.isCD || roles.isBoss || user.isDCC || user.isBoss) {
    return activities;
  }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/lib/auth.ts', content);
  console.log("Patched auth.ts successfully!");
} else {
  console.log("Could not find targetStr in auth.ts");
}
