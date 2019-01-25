import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
    CanLoad,
    Route
}
    from "@angular/router";
import { Injectable } from "@angular/core";
import * as fromRoot from "../app.reducer";
import { Store } from "@ngrx/store";
import { take } from "rxjs/operators";

@Injectable()
export class AuthGuard implements CanActivate, CanLoad {

    constructor(
        // private authService: AuthService,
        private store: Store<fromRoot.State>,
        private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // if (this.authService.isAuth()) {
        //     return true;
        // } else {
        //     this.router.navigate(['/login']);
        // }
        return this.store.select(fromRoot.getIsAut).pipe(take(1));
    }

    canLoad(route: Route) {
        // if (this.authService.isAuth()) {
        //     return true;
        // } else {
        //     this.router.navigate(['/login']);
        // }
        return this.store.select(fromRoot.getIsAut).pipe(take(1));
    }

}