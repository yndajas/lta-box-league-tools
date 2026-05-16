class Team {
  constructor(teamRow) {
    this.names = Team.namesFromNavLinkContainer(teamRow);
    this.matchCount = Team.matchCount(teamRow);
    this.rank =
      Number.parseInt(
        teamRow.querySelector(".standing-status").textContent,
        10,
      ) || null;
  }

  static matchCount(teamRow) {
    return Number.parseInt(
      teamRow.querySelector(".cell-points").textContent.trim(),
      10,
    );
  }

  static namesFromNavLinkContainer(navLinkContainer) {
    return Array.from(navLinkContainer.querySelectorAll(".nav-link__value"))
      .map((playerSpan) => playerSpan.textContent)
      .sort()
      .join(" / ");
  }
}

class Match {
  constructor(matchItem) {
    this.date = matchItem
      .querySelector(".match__footer")
      .innerText.substring(4)
      .split("/")
      .reverse()
      .join("-");

    this.winner = Team.namesFromNavLinkContainer(
      matchItem.querySelector(".match__row.has-won"),
    );
    this.winner = Team.namesFromNavLinkContainer(
      matchItem.querySelector(".match__row:not(.has-won)"),
    );

    const teamTwoWon = matchItem
      .querySelector(".match__row:nth-child(2)")
      .classList.contains("has-won");

    this.setScores = Array.from(
      matchItem.querySelectorAll(".match__result .points"),
    ).map((setGameCountList) => {
      const gameCounts = Array.from(
        setGameCountList.querySelectorAll(".points__cell"),
      ).map((setGameCountItem) => setGameCountItem.innerText);

      if (teamTwoWon) gameCounts.reverse();

      return gameCounts;
    });

    this.teamRetired = Array.from(
      matchItem.querySelectorAll(".match__row .match__message"),
    ).some((messageElement) => messageElement.innerText === "Retired");
  }
}

class Group {
  actualMatchCount;
  number;
  teams;

  constructor(loadedGroupNode) {
    this.number = Number.parseInt(
      loadedGroupNode
        .querySelector(".module__title-main")
        .textContent.trim()
        .split(" ")[1],
      10,
    );

    this.actualMatchCount = Number.parseInt(
      loadedGroupNode
        .querySelector(".js-edit-match-index .module-divider")
        .textContent.trim()
        .match(/[0-9]+/)[0],
      10,
    );

    this.teams = Array.from(loadedGroupNode.querySelectorAll("tbody tr"))
      .map((teamRow) => {
        if (
          teamRow.querySelector('s[title="Withdrawn"]') &&
          Team.matchCount(teamRow) === 0
        ) {
          return null;
        }

        return new Team(teamRow);
      })
      .filter((team) => team);

    this.matches = Array.from(
      loadedGroupNode.querySelectorAll(
        ".js-edit-match-index > div:first-child .match-group__item",
      ),
    ).map((matchItem) => new Match(matchItem));
  }

  static async get(groupNode) {
    //expand group
    groupNode.querySelector("button.collapsed")?.click();

    await new Promise((resolve) => {
      if (groupNode.querySelector(".module-container")) {
        resolve();
      }

      const observer = new MutationObserver((_mutations) => {
        if (groupNode.querySelector(".module-container")) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

    // load second page of results
    groupNode.querySelector(".load-more-btn-container button")?.click();

    return new Promise((resolve) => {
      if (!groupNode.querySelector(".load-more-btn-container")) {
        resolve(new Group(groupNode));
      }

      const observer = new MutationObserver((_mutations) => {
        if (!groupNode.querySelector(".load-more-btn-container")) {
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
        (groupNode) => Group.get(groupNode),
      ),
    );
  }

  maxMatchCount() {
    return (this.teams.length * (this.teams.length - 1)) / 2;
  }

  playedAllMatches() {
    return this.actualMatchCount === this.maxMatchCount();
  }

  teamPlayedAllMatches(team) {
    return team.matchCount === this.teams.length - 1;
  }
}

class GroupSeasonTableRowPresenter {
  constructor(group) {
    this.group = group;
  }

  teamText(team) {
    return `${team.names}${
      this.group.teamPlayedAllMatches(team) ? "&nbsp;👏" : ""
    }`;
  }

  present() {
    return `		<tr>
			<td><strong>${this.group.number}</strong></td>
			${this.rankCell(1)}
			${this.rankCell(2)}
			<td>${this.group.actualMatchCount} of ${this.group.maxMatchCount()}${
        this.group.playedAllMatches() ? "&nbsp;😁" : ""
      }</td>
		</tr>`;
  }

  rankCell(rank) {
    let innerText;
    const teams = this.group.teams.filter((team) => team.rank === rank);

    if (teams.length === 0 || teams[0].matchCount === 0) {
      innerText = "N/A";
    } else {
      innerText = new Intl.ListFormat("en").format(
        teams.map((team) => this.teamText(team)),
      );
    }

    return `<td>${innerText}</td>`;
  }
}

class GroupResultsCsvRowsPresenter {
  constructor(group) {
    this.group = group;
  }

  present() {
    return this.group.matches.map((match) => {
      let score = match.setScores
        .map((gameCounts) => gameCounts.join("-"))
        .join(" ");

      if (match.teamRetired) {
        score += " (retired)";
      }

      return [match.date, this.group.number, match.winner, match.loser, score];
    });
  }
}

let groups;

async function populatedGroups() {
  groups ||= (await Group.getAll()).sort((a, b) => a.number - b.number);

  return groups;
}

async function seasonTable() {
  return `
<table border="1" cellpadding="0" cellspacing="0" style="width:fit-content;">
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

async function resultsCsv() {
  const csvRows = [["date,group,winner,loser,score"]];

  (await populatedGroups()).forEach((group) => {
    csvRows.push(...new GroupResultsCsvRowsPresenter(group).present());
  });

  return csvRows.join("\n");
}

console.log(await seasonTable());
console.log(await resultsCsv());
