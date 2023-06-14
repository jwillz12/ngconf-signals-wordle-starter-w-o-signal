import {
  Component,
  computed,
  signal,
  effect,
  HostListener,
  OnInit,
} from '@angular/core';

enum TileStatus {
  unchecked = 'unchecked',
  matched = 'matched',
  missed = 'missed',
  wrong = 'wrong',
}

interface Board {
  attempts: Attempt[];
}

interface Attempt {
  tiles: Tile[];
}

interface Tile {
  letter: string;
  status: TileStatus;
}

type KeyMap = {
  [key: string]: any;
};

const ENTER = 'Enter';
const BACKSPACE = 'Backspace';
const ESCAPE = 'Escape';

const ATTEMPTS = 6;
const LETTERS = 5;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  chosenWord = 'coder';

  board!: Board;
  keyMap: KeyMap = {};

  totalAttempts = ATTEMPTS;
  totalLetters = LETTERS;
  currentAttempt = 0;
  currentTile = 0;
  message = '';
  solved = false;

  @HostListener('body:keyup', ['$event'])
  keyEvent({ key, which }: KeyboardEvent) {
    if (key === BACKSPACE) {
      this.deleteLetter();
    } else if (key === ESCAPE) {
      this.resetGame();
    } else if (key === ENTER && this.isAtEnd(this.currentTile)) {
      this.checkAttempt(this.currentAttempt);
    } else if (this.isValid(which) && !this.isAtEnd(this.currentTile)) {
      this.addLetter(key);
    }
  }

  ngOnInit() {
    this.resetGame();
  }

  updateStream(attempt: number) {
    console.log(
      `Trasmitting "${this.getAttemptedWord(attempt)}" to realtime stream`
    );
  }

  addLetter(key: string) {
    this.updateTile(this.currentAttempt, this.currentTile, key);
    this.nextTile();
  }

  deleteLetter() {
    this.prevTile();
    this.updateTile(this.currentAttempt, this.currentTile, '');
  }

  checkAttempt(attempt: number) {
    const word = this.getAttemptedWord(attempt);

    this.markMisses(attempt, word);
    this.markMatches(attempt, word);

    this.nextAttempt();
    this.resetCurrentTile();

    if (this.isChosenWord(word)) {
      const attempts = this.currentAttempt > 1 ? 'attempts' : 'attempt';
      this.message = `Congratulations! You solved the word in ${this.currentAttempt} ${attempts}`;
    }
  }

  markMisses(attempt: number, word: string) {
    const _attempt: Attempt = this.board.attempts[attempt];

    for (let i = 0; i < this.totalLetters; ++i) {
      const key = word[i];
      const _tile: Tile = _attempt.tiles[i];
      const status = this.chosenWord.includes(key)
        ? TileStatus.missed
        : TileStatus.wrong;
      _tile.status = status;
      this.markKeyboard(key, status);
    }
  }

  markMatches(attempt: number, word: string) {
    const _attempt: Attempt = this.board.attempts[attempt];

    for (let i = 0; i < this.totalLetters; ++i) {
      const key = word[i];
      if (key === this.chosenWord[i]) {
        const _tile: Tile = _attempt.tiles[i];
        _tile.status = TileStatus.matched;
        this.markKeyboard(key, TileStatus.matched);
      }
    }
  }

  markKeyboard(key: string, status: TileStatus) {
    this.keyMap[key] = status;
  }

  getAttemptedWord(attempt: number) {
    const _attempt = this.board.attempts[attempt];
    const word: string = _attempt.tiles
      .reduce((acc: any, curr: Tile) => [...acc, curr.letter], [])
      .join('')
      .toLowerCase();

    return word;
  }

  nextAttempt() {
    this.currentAttempt += 1;
  }

  nextTile() {
    this.currentTile += 1;
  }

  prevTile() {
    if (this.currentTile > 0) this.currentTile -= 1;
  }

  updateTile(attempt: number, tile: number, key: string) {
    const _attempt = this.board.attempts[attempt];
    const _tile = _attempt.tiles[tile];
    _tile.letter = key;
  }

  isAtEnd(index: number) {
    return index === this.totalLetters;
  }

  isValid(keyCode: number) {
    const LETTER_A = 65;
    const LETTER_Z = 90;
    return keyCode >= LETTER_A && keyCode <= LETTER_Z;
  }

  isChosenWord(word: string) {
    return word == this.chosenWord;
  }

  resetGame() {
    this.resetCurrentAttempt;
    this.resetCurrentTile;
    this.resetSolved();
    this.board = this.resetBoard();
    this.keyMap = this.resetKeyMap();
  }

  resetSolved() {
    this.solved = false;
  }

  resetCurrentAttempt() {
    this.currentAttempt = 0;
  }

  resetCurrentTile() {
    this.currentTile = 0;
  }

  resetKeyMap() {
    // Functional programming FTW!
    return 'abcdefghijklmnopqrstuvwxyz'
      .split('') //
      .reduce((acc: KeyMap, curr) => {
        acc[curr] = TileStatus.unchecked;
        return acc;
      }, {});
  }

  resetBoard() {
    const board: Board = {
      attempts: [],
    };
    for (let i = 0; i < this.totalAttempts; ++i) {
      const attempt: Attempt = {
        tiles: [],
      };
      for (let j = 0; j < this.totalLetters; ++j) {
        const title: Tile = { letter: '', status: TileStatus.unchecked };
        attempt.tiles.push(title);
      }
      board.attempts.push(attempt);
    }

    return board;
  }
}
