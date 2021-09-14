const { expect } = require("chai");
const hre = require("hardhat")
const ethers = hre.ethers;

describe("ourps", function () {
  it("Should have zero votes on deploy", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    expect((await ourps.getResults()).toString()).to.equal('0,0,0');
  });

  it("Should update votes", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let blue = await ourps.BLUE();
    let rock = await ourps.ROCK();
    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    await ourps.vote(blue, rock, overrides);

    // Mine a new block to include our transaction
    await hre.network.provider.send("evm_mine");

    expect((await ourps.getVotes(blue)).toString()).to.equal('1,0,0');
  });

  it("a round should not be ended without sufficient number of blocks", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    expect((await ourps.endRound()).wait()).to.be.reverted;
    await hre.network.provider.send("evm_mine");
  });

  it("round result draw", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let waitSeconds = parseInt((await ourps.VOTING_PERIOD()).toString());
    await hre.network.provider.send("evm_increaseTime", [waitSeconds]);

    let draw = (await ourps.DRAW()).toString();
    expect(ourps.endRound()).to.emit(ourps, 'RoundEnded').withArgs(draw)
    await hre.network.provider.send("evm_mine");
    await hre.network.provider.send("evm_mine");

    let red = await ourps.RED();
    let blue = await ourps.BLUE();
    expect((await ourps.getVotes(blue)).toString()).to.equal('0,0,0');
    expect((await ourps.getVotes(red)).toString()).to.equal('0,0,0');
    expect((await ourps.getResults()).toString()).to.equal('0,0,1');
  });

  it("red wins round", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");
    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let red = await ourps.RED();
    let blue = await ourps.BLUE();
    let draw = (await ourps.DRAW()).toString();
    let rock = await ourps.ROCK();

    await ourps.vote(red, rock, overrides);
    await hre.network.provider.send("evm_mine");

    let waitSeconds = parseInt((await ourps.VOTING_PERIOD()).toString());
    await hre.network.provider.send("evm_increaseTime", [waitSeconds]);

    expect(ourps.endRound()).to.emit(ourps, 'RoundEnded').withArgs(red)
    await hre.network.provider.send("evm_mine");
    await hre.network.provider.send("evm_mine");

    expect((await ourps.getVotes(blue)).toString()).to.equal('0,0,0');
    expect((await ourps.getVotes(red)).toString()).to.equal('0,0,0');
    expect((await ourps.getResults()).toString()).to.equal('1,0,0');
  });

  it("blue wins round", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");
    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let red = await ourps.RED();
    let blue = await ourps.BLUE();
    let draw = (await ourps.DRAW()).toString();
    let rock = await ourps.ROCK();

    await ourps.vote(blue, rock, overrides);
    await hre.network.provider.send("evm_mine");

    let waitSeconds = parseInt((await ourps.VOTING_PERIOD()).toString());
    await hre.network.provider.send("evm_increaseTime", [waitSeconds]);

    expect(ourps.endRound()).to.emit(ourps, 'RoundEnded').withArgs(blue);
    await hre.network.provider.send("evm_mine");
    await hre.network.provider.send("evm_mine");

    expect((await ourps.getVotes(blue)).toString()).to.equal('0,0,0');
    expect((await ourps.getVotes(red)).toString()).to.equal('0,0,0');
    expect((await ourps.getResults()).toString()).to.equal('0,1,0');
  });

  it("should not allow to vote after VOTING_PERIOD has ended", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let min_blocks = parseInt((await ourps.VOTING_PERIOD()).toString()) + 1;
    for (i = 0; i < min_blocks; i++) {
      await hre.network.provider.send("evm_mine");
    }

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };
    let blue = await ourps.BLUE()
    let rock = await ourps.ROCK()
    expect((await ourps.vote(blue, rock, overrides)).wait()).to.be.reverted;
    await hre.network.provider.send("evm_mine");
  });
  it("should not allow invalid team in voting", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");
    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    expect((await ourps.vote(5, rock, overrides)).wait()).to.be.reverted;
    await hre.network.provider.send("evm_mine");
  });

  it("should not allow invalid action in voting", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");
    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let blue = await ourps.BLUE();
    expect((await ourps.vote(blue, 5, overrides)).wait()).to.be.reverted;
    await hre.network.provider.send("evm_mine");
  });

  it("should not allow voting with insufficient funds", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let blue = await ourps.BLUE();
    expect((await ourps.vote(blue, 5)).wait()).to.be.reverted;
    await hre.network.provider.send("evm_mine");
  });

  it("should not return votes for an invalid team", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    await expect(ourps.getVotes(5)).to.be.revertedWith('Invalid team');
  });

  it("should pick rock", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, rock, overrides);
    await ourps.vote(blue, rock, overrides);
    await ourps.vote(blue, scissors, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(rock);
  });

  it("should pick rock 2", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, rock, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(rock);
  });

  it("should pick paper", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let paper = await ourps.PAPER();
    let scissors = await ourps.SCISSORS();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, paper, overrides);
    await ourps.vote(blue, paper, overrides);
    await ourps.vote(blue, scissors, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(paper);
  });

  it("should pick paper 2", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let paper = await ourps.PAPER();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, paper, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(paper);
  });

  it("should pick scissors", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let scissors = await ourps.SCISSORS();
    let rock = await ourps.ROCK();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, scissors, overrides);
    await ourps.vote(blue, scissors, overrides);
    await ourps.vote(blue, rock, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(scissors);
  });

  it("should pick scissors 2", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let scissors = await ourps.SCISSORS();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, scissors, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(scissors);
  });

  it("should pick scissors 2", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let scissors = await ourps.SCISSORS();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, scissors, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(scissors);
  });

  it("fails to pick", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    await ourps.vote(blue, scissors, overrides);
    await ourps.vote(blue, paper, overrides);

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getMove(blue)).to.equal(failedToPick);
  });

  it("scissors vs rock", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(rock, scissors)).to.equal(blue);
    expect(await ourps.getWinner(scissors, rock)).to.equal(red);
  });

  it("scissors vs paper", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(scissors, paper)).to.equal(blue);
    expect(await ourps.getWinner(paper, scissors)).to.equal(red);
  });

  it("scissors vs scissors", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(scissors, scissors)).to.equal(draw);
  });

  it("scissors vs failedToPick", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(scissors, failedToPick)).to.equal(blue);
    expect(await ourps.getWinner(failedToPick, scissors)).to.equal(red);
  });

  it("rock vs failedToPick", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(rock, failedToPick)).to.equal(blue);
    expect(await ourps.getWinner(failedToPick, rock)).to.equal(red);
  });

  it("rock vs paper", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(rock, paper)).to.equal(red);
    expect(await ourps.getWinner(paper, rock)).to.equal(blue);
  });

  it("rock vs rock", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(rock, rock)).to.equal(draw);
  });

  it("paper vs paper", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(paper, paper)).to.equal(draw);
  });

  it("paper vs failedToPick", async function () {
    const Ourps = await ethers.getContractFactory("ourps");
    const ourps = await Ourps.deploy();

    // Mine the deployment block
    await hre.network.provider.send("evm_mine");

    let overrides = {
      value: ethers.utils.parseEther("0.1")
    };

    let rock = await ourps.ROCK();
    let scissors = await ourps.SCISSORS();
    let paper = await ourps.PAPER();
    let failedToPick = await ourps.FAILED_TO_PICK();
    let blue = await ourps.BLUE();
    let draw = await ourps.DRAW();
    let red = await ourps.RED();

    await hre.network.provider.send("evm_mine");

    expect(await ourps.getWinner(paper, failedToPick)).to.equal(blue);
    expect(await ourps.getWinner(failedToPick, paper)).to.equal(red);
  });

});

