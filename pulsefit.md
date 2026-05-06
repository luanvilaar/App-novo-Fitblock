No site da FitBlock Training já existe uma lógica implementada de ranking semanal dos atletas e alunos que seguem a metodologia FitBlock.

Agora precisamos expandir essa funcionalidade para incluir boxes afiliados, começando pela PulseFit.

Objetivo

Implementar um ranking semanal específico para os alunos da PulseFit, mantendo a mesma lógica de pontuação já utilizada na FitBlock Training. A ideia é aumentar a motivação e engajamento dos alunos da box afiliada.

Requisitos do Ranking

1. Ranking geral

O ranking deve exibir todos os alunos juntos inicialmente (homens e mulheres).

Deve mostrar a posição semanal dos alunos da PulseFit.

2. Filtros de classificação
Adicionar filtros para visualização do ranking:

Gênero

Masculino

Feminino

Faixa etária

Sub 18

18 – 34

35 – 39

40 – 50+

Esses filtros devem reorganizar o ranking dinamicamente.

3. Estrutura multi-box
O sistema deve permitir que cada box afiliado tenha seu próprio ranking, mantendo separação entre:

FitBlock Training (ranking atual)

PulseFit (novo ranking)

A arquitetura deve ser preparada para adicionar novas boxes afiliadas no futuro.

4. Acesso e autenticação

Os alunos da PulseFit devem acessar pelo mesmo dashboard da FitBlock Training.

O processo de criação de conta e login deve seguir exatamente o fluxo já existente no sistema.

Cada usuário deve estar associado a uma box específica para que apareça no ranking correto.

5. Escalabilidade
A estrutura deve permitir futuramente:

múltiplas boxes afiliadas

rankings separados por box

ranking geral da rede FitBlock

IMPORTANTE
ESTE PROJETO ESTAR HOSPEDADO NO LOVABLE e sempre existe problemas com o banco de dados. lembre que este projeto usa o banco de dados do lovable cloud