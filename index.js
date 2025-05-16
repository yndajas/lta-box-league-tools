class Player {
  constructor(playerRow) {
    this.name = playerRow.querySelector(".nav-link__value").textContent;
    this.matchCount = Number.parseInt(
      playerRow.querySelector(".cell-points").textContent.trim(),
      10
    );
  }
}

class Group {
  actualMatchCount;
  number;
  players;

  constructor(loadedGroupNode) {
    this.number = Number.parseInt(
      loadedGroupNode
        .querySelector(".module__title-main")
        .textContent.trim()
        .split(" ")[1],
      10
    );

    this.actualMatchCount = Number.parseInt(
      loadedGroupNode
        .querySelector(".js-edit-match-index .module-divider")
        .textContent.trim()
        .match(/[0-9]+/)[0],
      10
    );

    this.players = Array.from(loadedGroupNode.querySelectorAll("tbody tr")).map(
      (playerRow) => new Player(playerRow)
    );
  }

  static async get(groupNode) {
    groupNode.querySelector("button.collapsed")?.click();

    return new Promise((resolve) => {
      if (groupNode.querySelector(".module-container")) {
        return resolve(new Group(groupNode));
      }

      const observer = new MutationObserver((_mutations) => {
        if (groupNode.querySelector(".module-container")) {
          observer.disconnect();
          resolve(new Group(groupNode));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  static async getAll() {
    return Promise.all(
      Array.from(document.querySelectorAll("div.js-edit-match-group")).map(
        (groupNode) => this.get(groupNode)
      )
    );
  }

  maxMatchCount() {
    return (this.players.length * (this.players.length - 1)) / 2;
  }

  playedAllMatches() {
    return this.actualMatchCount === this.maxMatchCount();
  }

  playerPlayedAllMatches(player) {
    return player.matchCount === this.players.length - 1;
  }

  playerCell(player) {
    return `<td>${player.name}${
      this.playerPlayedAllMatches(player) ? "&nbsp;👏" : ""
    }</td>`;
  }

  row() {
    return `		<tr>
			<td><strong>${this.number}</strong></td>
			${this.playerCell(this.players[0])}
			${this.playerCell(this.players[1])}
			<td>${this.actualMatchCount} of ${this.maxMatchCount()}${
      this.playedAllMatches() ? "&nbsp;😁" : ""
    }</td>
		</tr>`;
  }
}

async function seasonTable() {
  const groups = (await Group.getAll()).sort((a, b) => a.number - b.number);

  return `
<table border="1" cellpadding="0" cellspacing="0" style="width:fit-content; max-width:100%">
	<tbody>
		<tr>
			<td><strong>Box</strong></td>
			<td><strong>Winner&nbsp;🥇</strong></td>
			<td><strong>Runner up&nbsp;🥈</strong></td>
			<td><strong>Matches played</strong></td>
		</tr>
${groups.map((group) => group.row()).join("\n")}
	</tbody>
</table>`;
}

console.log(await seasonTable());
