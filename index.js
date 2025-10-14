class Player {
  constructor(playerRow) {
    this.name = playerRow.querySelector(".nav-link__value").textContent;
    this.matchCount = Player.matchCount(playerRow);
    this.rank = Number.parseInt(
      playerRow.querySelector(".standing-status").textContent,
      10
    );
  }

  static matchCount(playerRow) {
    return Number.parseInt(
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

    this.players = Array.from(loadedGroupNode.querySelectorAll("tbody tr"))
      .map((playerRow) => {
        if (
          playerRow.querySelector('s[title="Withdrawn"]') &&
          Player.matchCount(playerRow) === 0
        ) {
          return null;
        }

        return new Player(playerRow);
      })
      .filter((player) => player);
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

}

class GroupSeasonTableRowPresenter {
  constructor(group) {
    this.group = group
  }

  playerText(player) {
    return `${player.name}${
      this.group.playerPlayedAllMatches(player) ? "&nbsp;👏" : ""
    }`;
  }

  present() {
    return `		<tr>
			<td><strong>${this.group.number}</strong></td>
			${this.rankCell(1)}
			${this.rankCell(2)}
			<td>${this.actualMatchCount} of ${this.group.maxMatchCount()}${
      this.group.playedAllMatches() ? "&nbsp;😁" : ""
    }</td>
		</tr>`;
  }

  rankCell(rank) {
    const players = this.group.players.filter((player) => player.rank === rank);
    return `<td>${new Intl.ListFormat("en").format(
      players.map((player) => this.playerText(player))
    )}</td>`;
  }
}

let groups;

async function populatedGroups() {
  groups ||= (await Group.getAll()).sort((a, b) => a.number - b.number);

  return groups;
}

async function seasonTable() {
  return `
<table border="1" cellpadding="0" cellspacing="0" style="width:fit-content; max-width:100%">
	<tbody>
		<tr>
			<td><strong>Box</strong></td>
			<td><strong>Winner&nbsp;🥇</strong></td>
			<td><strong>Runner up&nbsp;🥈</strong></td>
			<td><strong>Matches played</strong></td>
		</tr>
${(await populatedGroups()).map((group) => new GroupSeasonTableRowPresenter(group).present()).join("\n")}
	</tbody>
</table>`;
}

console.log(await seasonTable());
