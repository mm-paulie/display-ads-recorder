#! /usr/bin/env node

const displayAdsRecorder = require("../src/index");
// const jsonParseDeep = require('./src/util/jsonParseDeep');
const { program, Option } = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");
const inquirer = require("inquirer");
const findAdsInDirectory = require("../src/util/findAdsInDirectory");
// const base64 = require("../src/util/base64");

(async () => {
  program
    .version(packageJson.version)
    // .option('-g, --glob <data>', 'Globbing pattern like "-p ./src/**/.richmediarc"')
    .option("-c, --chunkSize <data>", "Define chunkSize", 10)
    .option("-t, --targetDir <data>", "Set target dir")
    .option(
      "-j, --jpg [optional]",
      "If you want to output jpg and optional kbs"
    )
    .addOption(
      new Option(
        "-g, --gif <animation>",
        "If you want to output animated gifs"
      ).choices([-1, 0]),
      "loop"
    )
    .option("-m, --mp4", "If you want to output video", false)
    .option("-g, --fps <data>", "fps for gif and/or mp4", 15)
    .option("-a, --all", "If you want to record all", false)
    .parse(process.argv);
  const options = program.opts();

  console.log(options);

  console.log(
    `Welcome to the ${chalk.green.bold(`Display.Monks Record Tool`)} v${
      packageJson.version
    }`
  );

  console.log(
    "make sure you import and include the enableAdsRecorder(timeline, config) function from display temple"
  );
  console.log("so the ad can dispatch the right events to the recorder tool");
  console.log(
    "see example here: http://www.github.com/mirkovw/display-record-template"
  );

  const { targetDir } = options.targetDir
    ? options
    : await inquirer.prompt({
        type: "input",
        name: "targetDir",
        message: "Target Dir?",
        default: "./build",
      });

  const allAds = await findAdsInDirectory(targetDir);

  console.log(`found ${allAds.length} ad(s)`);

  const configQuestions = [];

  const { location } = options.all
    ? { location: allAds }
    : await inquirer.prompt({
        type: "checkbox",
        name: "location",
        message: "Please select ad(s) to record:",
        validate: (answers) => answers.length > 0,
        choices: [
          { name: "all", checked: false },
          ...allAds.map((value) => {
            return {
              value,
              checked: false,
            };
          }),
        ],
      });

  const allOutputs = { jpg: options.jpg, gif: options.gif, mp4: options.mp4 };
  console.log(options.jpg);
  const { output } =
    options.jpg || options.mp4 || options.gif
      ? {
          output: Object.entries(allOutputs)
            .filter(([key, value]) => value)
            .map(([key]) => key),
        }
      : await inquirer.prompt({
          type: "checkbox",
          name: "output",
          message: "Please select output(s)",
          validate: (answers) => answers.length > 0,
          choices: [
            { name: "mp4", value: "mp4", checked: false },
            { name: "gif (animated)", value: "gif", checked: false },
            { name: "jpg (last frame)", value: "jpg", checked: false },
          ],
        });

  configQuestions.push({
    type: "list",
    name: "gifLoopOptions",
    when: output.includes("gif"),
    message:
      "You selected .gif as additional output. Would you like it run once or loop?",
    choices: [
      { name: "Run once", value: "-1" },
      { name: "Loop", value: "0" },
    ],
    default: 0,
  });

  configQuestions.push({
    type: "list",
    name: "fps",
    when: output.includes("mp4") || output.includes("gif"),
    message: "Please select fps to record at",
    choices: [{ name: 15 }, { name: 30 }, { name: 60 }],
    default: 1,
  });

  console.log("jpgQuality", options.jpgQuality);

  const { jpgMaxFileSize } = options.jpgQuality
    ? { jpgMaxFileSize: options.jpgQuality }
    : await inquirer.prompt({
        type: "input",
        name: "jpgMaxFileSize",
        when: output.includes("jpg"),
        message: "Please select max KB filesize for backup image",
        default: 40,
      });

  const adSelection = await inquirer.prompt(configQuestions);

  adSelection.location = options.all
    ? location
    : location.indexOf("all") > -1
    ? allAds
    : location;

  console.log("output", output);
  adSelection.output = output;
  adSelection.jpgMaxFileSize = jpgMaxFileSize;

  await displayAdsRecorder(
    {
      targetDir,
      adSelection,
    },
    options.chunkSize
  );
})();
