
# Explicação da Lógica de "Autor do Comentário" e "Cadastrado Por"

## 1. Objetivo Geral
Exibir o **nome completo** da pessoa que:
- Criou o parceiro ("Cadastrado por")
- Fez o comentário de rejeição ("Autor do comentário")

---

## 2. Por que não só usar o ID?
Os dados do backend só retornam o **ID** da pessoa:
```json
// Dados do parceiro (exemplo)
{
  "id": 287,
  "angariador_id": 93, // ID de quem cadastrou
  ...
}

// Comentário (exemplo)
{
  "user_id": 57, // ID de quem comentou
  "comentario": "SIM REGISTADO ANTES..."
}
```
Para exibir o **nome**, precisamos BUSCAR esse ID em listas existentes!

---

## 3. Estratégia: Buscar Listas e Cachear na Memória

### 3.1 Listas que usamos
Para encontrar o nome, usamos 3 listas que já existiam na API:
1. **`allUsers`**: Todos os colaboradores do sistema (endpoint `/api/v1/users/`)
2. **`allAngariadores`**: Todos os angariadores (endpoint `/api/v1/angariadores/meus`)
3. **`allTvrs`**: Todos os TVRs (endpoint `/api/v1/tvrs/`)

### 3.2 Passo a passo da implementação

#### A. No `apiResources.ts`: Adicionamos a função `getAllUsers()`
```typescript
export async function getAllUsers() {
  const api = await getAuthApi();
  const res = await api.get('/api/v1/users/');
  return Array.isArray(res.data) ? res.data : [];
}
```
Isso busca **todos os usuários** do sistema.

---

#### B. No `ParceirosListScreen.tsx`:
1. **Criamos estados para armazenar as listas**:
```typescript
const [allUsers, setAllUsers] = useState<any[]>([]);
const [allAngariadores, setAllAngariadores] = useState<any[]>([]);
const [allTvrs, setAllTvrs] = useState<any[]>([]);
```

2. **Criamos uma função para buscar essas listas**:
```typescript
const fetchAllPeople = async () => {
  try {
    const users = await getAllUsers();
    setAllUsers(users);
    
    const angariadores = await listMyAngariadores();
    setAllAngariadores(angariadores);
    
    const tvrs = await listTvrs();
    setAllTvrs(tvrs);
  } catch (e) {
    console.error("Erro ao buscar pessoas:", e);
  }
};
```

3. **Chamamos essa função no `useEffect`** (quando a tela abre):
```typescript
useEffect(() => {
  Promise.all([
    fetchData(),       // Busca parceiros
    fetchAllPeople()   // Busca usuários, angariadores, TVRs
  ]).finally(() => setLoading(false));
}, []);
```

4. **Criamos a função `getAuthorName(userId)`** para procurar o nome na lista:
```typescript
const getAuthorName = (userId: number) => {
  // Primeiro, tenta encontrar na lista de usuários (colaboradores)
  const user = allUsers.find(u => u.id === userId);
  if (user?.name) return user.name;

  // Depois, tenta na lista de angariadores
  const angariador = allAngariadores.find(a => a.id === userId);
  if (angariador?.nome) return angariador.nome;

  // Por fim, tenta na lista de TVRs
  const tvr = allTvrs.find(t => t.id === userId);
  if (tvr?.nome) return tvr.nome;

  // Se não encontrar nada, usa o fallback "Usuário X"
  return `Usuário ${userId}`;
};
```

5. **Usamos essa função no JSX para exibir o nome**:
```tsx
{/* Seção de comentários */}
{selectedParceiro.comentarios && selectedParceiro.comentarios.length > 0 && (
  <View style={styles.modalSection}>
    <Text style={styles.modalSectionTitle}>Comentários</Text>
    {selectedParceiro.comentarios.map((comentario: any, index: number) => (
      <View key={index} style={styles.commentBox}>
        <Text style={styles.commentAuthor}>
          {/* Aqui é onde usamos getAuthorName! */}
          {getAuthorName(comentario.user_id)} • {new Date(comentario.data_criacao).toLocaleDateString('pt-MZ')}
        </Text>
        <Text style={styles.commentText}>{comentario.texto || comentario.comentario}</Text>
      </View>
    ))}
  </View>
)}
```

---

## 4. Lógica de "Cadastrado Por" (já existia!)
A lógica de "Cadastrado por" já funcionava! Vamos recapitular:
```typescript
// Função que já existia no código
const creatorName = (item: any) => {
  if (item.angariador_nome) {
    return item.angariador_nome;
  }
  if (item.tvr_nome) {
    return item.tvr_nome;
  }
  if (item.user_nome) {
    return item.user_nome;
  }
  if (item.cadastrado_por_nome) {
    return item.cadastrado_por_nome;
  }
  return 'Desconhecido';
};
```
O backend **já retorna o nome** diretamente no objeto do parceiro nos campos `angariador_nome`, `tvr_nome` ou `user_nome`!

---

## 5. Resumo em Fluxograma
```
1. A tela abre
   ↓
2. Busca parceiros (fetchData) E busca listas de pessoas (fetchAllPeople)
   ↓
3. Armazena as listas na memória
   ↓
4. Quando o usuário clica em um parceiro:
   a. Abre o modal
   b. Para cada comentário, chama getAuthorName(comentario.user_id)
   c. Procura o ID na lista em memória
   d. Exibe o nome encontrado!
```

---

## 6. Por que essa abordagem?
- **Não mexemos no backend**: Reutilizamos endpoints que já existiam
- **Rápido**: A busca é feita em memória (não faz requisições a cada comentário)
- **Sempre funciona**: Mesmo que o nome não esteja no backend, temos um fallback ("Usuário X")
