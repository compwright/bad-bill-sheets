import Members from './Members.js';
import Sessions from './Sessions.js';
import Votes from './Votes.js';
import Bills from './Bills.js';

export default class Api {
    members;
    sessions;
    votes;
    bills;

    constructor() {
        this.members = new Members();
        this.sessions = new Sessions();
        this.votes = new Votes();
        this.bills = new Bills();
    }
}
