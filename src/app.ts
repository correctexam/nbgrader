import * as cheerio from "cheerio";
import axios, { AxiosRequestConfig, AxiosPromise } from "axios";
import { v4 as uuidv4 } from "uuid";
import html2canvas from 'html2canvas';


class Response {
  public element: any[] = [];
}

function addIDToDiv($: cheerio.CheerioAPI) {
  const divs = $("div");
  divs.each((e, el) => {
    if (el.attribs["id"] === undefined || el.attribs["id"] === "") {
      el.attribs["id"] = uuidv4();
    }
  });
}

async function main(file:string, questionIndex:number,c:boolean): Promise<string> {
  const resp = await axios.get(
    file
  );

  const $ = await cheerio.load(resp.data);
  addIDToDiv($);

  const question = $("#toc").find("li").find("a");
    const nbrQuestion = question.length;
    if (questionIndex< 0 || questionIndex>= nbrQuestion){
        return 'no score'
    }

  const anchors = question
    .map((e, el) => el.attribs["href"].substring(1))
    .toArray();

  const idsWithAnswer = $("div.cell a")
    .filter(
      (e, el) =>
        el.attribs["name"] !== undefined && anchors.includes(el.attribs["name"])
    )
    .closest("div.cell")
    .map((e, el) => (el as any).attribs["id"])
    .toArray();

  const notbook = $("#notebook-container").find("div.cell");
  const responses: Response[] = [];
  let currentResponse: Response | undefined = undefined;
  for (const cell of notbook) {
    if (currentResponse === undefined) {
      currentResponse = new Response();
      responses.push(currentResponse);
    }

    currentResponse.element.push(cell.attribs["id"]);

    if (idsWithAnswer.includes(cell.attribs["id"])) {
      currentResponse = undefined;
    }
  }

  const score = showSection(questionIndex, responses, $);

  $("#toc").closest("div.panel-heading").remove();

  document.getElementById("body")!.innerHTML = $.html();
if (c){

 html2canvas(document.getElementById("body")!).then(function(canvas) {
    document.getElementById("body")!.parentNode!.insertBefore(canvas, document.getElementById("body"));
    document.getElementById("body")!.remove();

});
}
    const note = score.substring(0,score.indexOf('/')-1)
    const notemax = score.substring(score.indexOf('/')+1)
    document.getElementById("snote")!.innerHTML = ''+note;
    document.getElementById("snotemax")!.innerHTML = ''+notemax;


    return score;

}

function showSection(
  index: number,
  responses: Response[],
  $: cheerio.CheerioAPI
): string {
    let res = ''
  responses.forEach((e, i) => {
    if (i === index) {
      e.element.forEach((e2) => {
        const e1 = $('[id="' + e2 + '"]').find('span.pull-right');
        if (e1.get().length>0){
            const e5 = e1.get()[0].children.filter(e4=> (e4 as any).data && (e4 as any).data.includes('Score')  )
            if (e5.length>0){
                const start = (e5[0] as any).data.indexOf(': ');
                res  =(e5[0] as any).data.substring(start + 1,(e5[0] as any).data.length)
            }
        }
      });
    } else {
      e.element.forEach((e2) => {
        const query = '[id="' + e2 + '"]';
        $(query).remove();
      });
    }
  });
  return res;
}

const urlParams = new URLSearchParams(window.location.search);
let cell = 1
if (urlParams.has('cell'))
{
    cell = +urlParams.get('cell')! -1
}
let canvas = true
if (urlParams.has('canvas'))
{
    canvas = 'false'!==urlParams.get('canvas')!
}

let filename = 'demo'
if (urlParams.has('filename'))
{
    filename = urlParams.get('filename')!
}


console.error(filename)

main('/input/'+filename+'.html',cell,canvas).then(e=> console.log("affichage"));
